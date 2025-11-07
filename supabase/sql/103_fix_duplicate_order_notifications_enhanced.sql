-- Migration 103: Fix duplicate order notifications - enhanced check
-- Prevents duplicate notifications when UPDATE is called multiple times
-- Also ensures only one trigger exists and prevents firing on unchanged updates

-- Drop any duplicate triggers first
DROP TRIGGER IF EXISTS trigger_notify_order_events ON public.orders;
DROP TRIGGER IF EXISTS trigger_order_notifications ON public.orders;

-- Update the function with enhanced duplicate prevention
CREATE OR REPLACE FUNCTION notify_order_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$

DECLARE
  v_sender_role text;
  customer_name text;
  admin_name text;
  order_display_id text;
  formatted_status text;
  is_valued_customer boolean;
BEGIN
  -- For UPDATE operations, only proceed if relevant fields actually changed
  IF TG_OP = 'UPDATE' THEN
    -- Skip if nothing relevant changed
    IF OLD.status = NEW.status 
       AND (OLD.payment_proof IS NOT DISTINCT FROM NEW.payment_proof)
       AND (OLD.payment_verified_at IS NOT DISTINCT FROM NEW.payment_verified_at)
       AND (OLD.payment_denied_at IS NOT DISTINCT FROM NEW.payment_denied_at)
       AND (OLD.updated_by IS NOT DISTINCT FROM NEW.updated_by) THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Get order display_id
  order_display_id := COALESCE(NEW.display_id, SUBSTRING(NEW.order_id::text, 1, 8));

  -- Get customer name and type
  SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), 'Customer'),
         customer_type = 'valued'
  INTO customer_name, is_valued_customer
  FROM public.customer 
  WHERE customer_id = NEW.customer_id;

  -- Format status using formatter function
  formatted_status := format_order_status(NEW.status);

  -- Determine sender role based on operation and updated_by field
  -- INSERT operations → check updated_by to determine if admin or customer created it
  IF TG_OP = 'INSERT' THEN
    IF NEW.updated_by IS NOT NULL THEN
      -- Check if updated_by is an admin
      IF EXISTS (
        SELECT 1 FROM public.customer
        WHERE customer_id = NEW.updated_by
        AND customer_type = 'admin'
      ) THEN
        v_sender_role := 'admin';
        -- Get admin name for admin-initiated notifications
        SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), 'Admin')
        INTO admin_name
        FROM public.customer
        WHERE customer_id = NEW.updated_by;
      ELSE
        v_sender_role := 'customer';
      END IF;
    ELSE
      -- No updated_by on INSERT → assume customer-initiated
      v_sender_role := 'customer';
    END IF;
  -- UPDATE operations → check updated_by vs customer_id
  ELSIF NEW.updated_by IS NOT NULL THEN
    IF NEW.updated_by = NEW.customer_id THEN
      v_sender_role := 'customer';
    ELSE
      -- updated_by is different from customer_id, check if they're admin
      IF EXISTS (
        SELECT 1 FROM public.customer
        WHERE customer_id = NEW.updated_by
        AND customer_type = 'admin'
      ) THEN
        v_sender_role := 'admin';
        -- Get admin name for admin-initiated notifications
        SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), 'Admin')
        INTO admin_name
        FROM public.customer
        WHERE customer_id = NEW.updated_by;
      ELSE
        v_sender_role := 'customer';
      END IF;
    END IF;
  -- If updated_by is NULL, use fallback logic based on status changes
  ELSE
    -- Specific status changes that indicate customer action
    IF NEW.status IN ('verifying_payment', 'reupload_payment', 'cancelled') THEN
      v_sender_role := 'customer';
    -- Other status changes likely indicate admin action
    ELSE
      v_sender_role := 'admin';
    END IF;
  END IF;

  -- Admin-initiated → notify customer only
  IF v_sender_role = 'admin' THEN
    -- Special case: Payment verified AND status changed to for_pickup/for_delivery simultaneously
    -- Send TWO notifications: payment verified and order update
    IF TG_OP = 'UPDATE' 
       AND NEW.payment_verified_at IS NOT NULL 
       AND (OLD.payment_verified_at IS NULL OR OLD.payment_verified_at IS DISTINCT FROM NEW.payment_verified_at)
       AND NEW.status IN ('for_pickup', 'for_delivery') THEN
      -- First notification: Payment Verified
      INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
      VALUES (
        NEW.customer_id,
        'order',
        NEW.order_id,
        'Payment Verified',
        'Your payment for order ' || order_display_id || ' has been verified by Admin ' || COALESCE(admin_name, 'Admin') || '.',
        'success',
        'order'
      );
      
      -- Second notification: Order Update (For Pickup/For Delivery)
      INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
      VALUES (
        NEW.customer_id,
        'order',
        NEW.order_id,
        'Order Update',
        CASE 
          WHEN NEW.status = 'for_pickup' THEN
            'Your order ' || order_display_id || ' status changed to For Pickup. Please create a ticket by asking for assistance to inquire how to get your product.'
          WHEN NEW.status = 'for_delivery' THEN
            'Your order ' || order_display_id || ' status changed to For Delivery. Please create a ticket by asking for assistance to inquire how to get your product.'
        END,
        'info',
        'order'
      );
    ELSE
      -- Regular single notification cases
      INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
      VALUES (
        NEW.customer_id,
        'order',
        NEW.order_id,
        CASE 
          WHEN NEW.status = 'processing' AND NEW.payment_verified_at IS NOT NULL THEN 'Payment Verified'
          WHEN NEW.status = 'reupload_payment' AND NEW.payment_denied_at IS NOT NULL THEN 'Payment Denied'
          WHEN NEW.status = 'for_pickup' THEN 'Order Update'
          WHEN NEW.status = 'for_delivery' THEN 'Order Update'
          WHEN TG_OP = 'INSERT' AND NEW.status = 'processing' THEN 'Order Created'
          WHEN TG_OP = 'INSERT' AND NEW.status = 'awaiting_payment' THEN 'Order Created'
          ELSE 'Order Update'
        END,
        CASE 
          WHEN NEW.status = 'processing' AND NEW.payment_verified_at IS NOT NULL THEN
            'Your payment for order ' || order_display_id || ' has been verified by Admin ' || COALESCE(admin_name, 'Admin') || '.'
          WHEN NEW.status = 'reupload_payment' AND NEW.payment_denied_at IS NOT NULL AND NEW.denial_reason IS NOT NULL THEN
            'Your payment for order ' || order_display_id || ' was denied by Admin ' || COALESCE(admin_name, 'Admin') || '. Reason: ' || NEW.denial_reason || '. Please upload a new payment proof.'
          WHEN NEW.status = 'reupload_payment' AND NEW.payment_denied_at IS NOT NULL THEN
            'Your payment for order ' || order_display_id || ' was denied by Admin ' || COALESCE(admin_name, 'Admin') || '. Please upload a new payment proof.'
          WHEN NEW.status = 'for_pickup' THEN
            'Your order ' || order_display_id || ' status changed to For Pickup. Please create a ticket by asking for assistance to inquire how to get your product.'
          WHEN NEW.status = 'for_delivery' THEN
            'Your order ' || order_display_id || ' status changed to For Delivery. Please create a ticket by asking for assistance to inquire how to get your product.'
          WHEN NEW.status = 'awaiting_payment' AND is_valued_customer THEN
            'Your order ' || order_display_id || ' status changed to Awaiting Payment. Your order is now complete and ready for payment.'
          WHEN NEW.status = 'awaiting_payment' THEN
            'Your order ' || order_display_id || ' status changed to Awaiting Payment. Please upload your payment proof.'
          WHEN TG_OP = 'INSERT' AND NEW.status = 'processing' THEN
            'Your order ' || order_display_id || ' has been created and is now being processed.'
          WHEN TG_OP = 'INSERT' AND NEW.status = 'awaiting_payment' THEN
            'Your order ' || order_display_id || ' has been created. Please upload your payment proof.'
          ELSE
            'Your order ' || order_display_id || ' status changed to ' || formatted_status || '.'
        END,
        CASE 
          WHEN NEW.status = 'processing' AND NEW.payment_verified_at IS NOT NULL THEN 'success'
          WHEN NEW.status = 'reupload_payment' AND NEW.payment_denied_at IS NOT NULL THEN 'warning'
          ELSE 'info'
        END,
        'order'
      );
    END IF;
  END IF;

  -- Customer-initiated → notify admins only
  IF v_sender_role = 'customer' THEN
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    SELECT c.customer_id, 'order', NEW.order_id,
           CASE 
             -- Check if this is a reupload: OLD status was 'reupload_payment' and NEW status is 'verifying_payment'
             WHEN TG_OP = 'UPDATE' AND OLD.status = 'reupload_payment' AND NEW.status = 'verifying_payment' THEN 'Payment Proof Reuploaded'
             -- Initial upload: status changed to 'verifying_payment' from 'awaiting_payment' or other status
             WHEN NEW.status = 'verifying_payment' THEN 'Payment Proof Uploaded'
             WHEN NEW.status = 'reupload_payment' THEN 'Payment Proof Reuploaded'
             WHEN NEW.status = 'cancelled' THEN 'Order Cancelled'
             ELSE 'Order Update'
           END,
           CASE 
             -- Reupload: OLD status was 'reupload_payment'
             WHEN TG_OP = 'UPDATE' AND OLD.status = 'reupload_payment' AND NEW.status = 'verifying_payment' THEN
               'Customer ' || customer_name || ' reuploaded payment proof for order ' || order_display_id || '.'
             -- Initial upload
             WHEN NEW.status = 'verifying_payment' THEN
               'Customer ' || customer_name || ' uploaded payment proof for order ' || order_display_id || '.'
             WHEN NEW.status = 'reupload_payment' THEN
               'Customer ' || customer_name || ' reuploaded payment proof for order ' || order_display_id || '.'
             WHEN NEW.status = 'cancelled' THEN
               'Customer ' || customer_name || ' cancelled order ' || order_display_id || '.'
             ELSE
               'Order ' || order_display_id || ' updated by ' || customer_name || ' (' || formatted_status || ').'
           END,
           CASE 
             WHEN NEW.status = 'cancelled' THEN 'warning'
             ELSE 'info'
           END,
           'order'
    FROM public.customer c
    WHERE c.customer_type = 'admin'
    -- Prevent duplicate notifications by checking if notification already exists
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.customer_id = c.customer_id
      AND n.source_type = 'order'
      AND n.source_id = NEW.order_id
      AND n.title = CASE 
        WHEN TG_OP = 'UPDATE' AND OLD.status = 'reupload_payment' AND NEW.status = 'verifying_payment' THEN 'Payment Proof Reuploaded'
        WHEN NEW.status = 'verifying_payment' THEN 'Payment Proof Uploaded'
        WHEN NEW.status = 'reupload_payment' THEN 'Payment Proof Reuploaded'
        WHEN NEW.status = 'cancelled' THEN 'Order Cancelled'
        ELSE 'Order Update'
      END
      AND n.created_at > NOW() - INTERVAL '5 seconds'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create single trigger
CREATE TRIGGER trigger_order_notifications
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_events();

-- Add comment for documentation
COMMENT ON FUNCTION notify_order_events() IS 
'Handles all order notifications: payment verification/denial (admin→customer), payment uploads/reuploads/cancellation (customer→admins). Uses SECURITY DEFINER to bypass RLS. Prevents duplicates with time-based check.';

