-- Migration 075: Fix notify_order_events function to detect sender role and notify only the other party
-- This prevents customers from receiving notifications about their own actions

-- Drop existing function and trigger
DROP FUNCTION IF EXISTS notify_order_events() CASCADE;

-- Create the fixed function with proper sender detection logic
CREATE OR REPLACE FUNCTION notify_order_events()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_role text;
  customer_name text;
BEGIN
  -- Determine sender role based on operation and updated_by field
  -- INSERT operations → always customer-initiated → notify admins only
  IF TG_OP = 'INSERT' THEN
    v_sender_role := 'customer';
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
      ELSE
        v_sender_role := 'customer';
      END IF;
    END IF;
  -- If updated_by is NULL, use fallback logic based on status changes
  ELSE
    -- Specific status changes that indicate customer action
    IF NEW.status IN ('verifying_payment', 'reupload_payment') THEN
      v_sender_role := 'customer';
    -- Other status changes likely indicate admin action
    ELSE
      v_sender_role := 'admin';
    END IF;
  END IF;

  -- Resolve display name for customer
  SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), 'Customer')
  INTO customer_name
  FROM public.customer 
  WHERE customer_id = NEW.customer_id;

  -- Admin-initiated → notify customer only
  IF v_sender_role = 'admin' THEN
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    VALUES (
      NEW.customer_id,
      'order',
      NEW.order_id,
      'Order Update',
      'Your order #' || COALESCE(NEW.display_id, SUBSTRING(NEW.order_id::text, 1, 8)) || ' status changed to "' || NEW.status || '".',
      'info',
      'order'
    );
  END IF;

  -- Customer-initiated → notify admins only
  IF v_sender_role = 'customer' THEN
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    SELECT c.customer_id, 'order', NEW.order_id,
           CASE WHEN NEW.status = 'verifying_payment' THEN 'Payment Proof Uploaded'
                WHEN NEW.status = 'reupload_payment' THEN 'Payment Proof Reuploaded'
                ELSE 'Order Update' END,
           CASE WHEN NEW.status = 'verifying_payment' THEN 'Payment proof uploaded for order #' || COALESCE(NEW.display_id, SUBSTRING(NEW.order_id::text, 1, 8)) || ' by ' || customer_name || '.'
                WHEN NEW.status = 'reupload_payment' THEN 'Payment proof reuploaded for order #' || COALESCE(NEW.display_id, SUBSTRING(NEW.order_id::text, 1, 8)) || ' by ' || customer_name || '.'
                ELSE 'Order #' || COALESCE(NEW.display_id, SUBSTRING(NEW.order_id::text, 1, 8)) || ' updated by ' || customer_name || ' (' || NEW.status || ').' END,
           'warning', 'order'
    FROM public.customer c
    WHERE c.customer_type = 'admin';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_order_notifications
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_events();

-- Add comment for documentation
COMMENT ON FUNCTION notify_order_events() IS 'Notifies only the OTHER party when orders are updated - prevents self-notifications';
