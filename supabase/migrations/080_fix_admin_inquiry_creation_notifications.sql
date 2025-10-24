-- Migration 080: Fix admin inquiry creation notifications
-- Admin-created inquiries should notify customers, not admins

-- Drop existing function and trigger
DROP FUNCTION IF EXISTS notify_ticket_events() CASCADE;

-- Create the fixed function with proper INSERT logic
CREATE OR REPLACE FUNCTION notify_ticket_events()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_role text;
  customer_name text;
BEGIN
  -- Determine sender role based on operation and updated_by field
  -- INSERT operations → check updated_by field to determine if admin created it
  IF TG_OP = 'INSERT' THEN
    IF NEW.updated_by IS NOT NULL THEN
      -- Check if updated_by is an admin
      IF EXISTS (
        SELECT 1 FROM public.customer
        WHERE customer_id = NEW.updated_by
        AND customer_type = 'admin'
      ) THEN
        v_sender_role := 'admin';
      ELSE
        v_sender_role := 'customer';
      END IF;
    ELSE
      -- No updated_by field, assume customer-initiated
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
      ELSE
        v_sender_role := 'customer';
      END IF;
    END IF;
  -- If updated_by is NULL, use fallback logic based on status changes
  ELSE
    -- Status changes that indicate admin action
    IF NEW.inquiry_status IN ('under_review', 'resolved', 'closed') THEN
      v_sender_role := 'admin';
    -- Status changes that indicate customer action
    ELSIF NEW.inquiry_status IN ('pending_customer_reply') THEN
      v_sender_role := 'customer';
    -- Default fallback for other statuses
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
      'ticket',
      NEW.inquiry_id,
      'Ticket Update',
      'Your support ticket #' || COALESCE(NEW.display_id, SUBSTRING(NEW.inquiry_id::text, 1, 8)) || ' status changed to "' || NEW.inquiry_status || '".',
      'info',
      'ticket'
    );
  END IF;

  -- Customer-initiated → notify admins only
  IF v_sender_role = 'customer' THEN
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    SELECT c.customer_id, 'ticket', NEW.inquiry_id,
           CASE WHEN TG_OP = 'INSERT' THEN 'New Support Ticket'
                ELSE 'Ticket Update' END,
           CASE WHEN TG_OP = 'INSERT' THEN 'New support ticket #' || COALESCE(NEW.display_id, SUBSTRING(NEW.inquiry_id::text, 1, 8)) || ' created by ' || customer_name || '.'
                ELSE 'Support ticket #' || COALESCE(NEW.display_id, SUBSTRING(NEW.inquiry_id::text, 1, 8)) || ' updated by ' || customer_name || ' (' || NEW.inquiry_status || ').' END,
           'warning', 'ticket'
    FROM public.customer c
    WHERE c.customer_type = 'admin';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger for inquiries_v2 table
CREATE TRIGGER trigger_ticket_notifications_v2
AFTER INSERT OR UPDATE ON inquiries_v2
FOR EACH ROW
EXECUTE FUNCTION notify_ticket_events();

-- Add comment for documentation
COMMENT ON FUNCTION notify_ticket_events() IS 'Notifies only the OTHER party when tickets are updated - prevents self-notifications. Fixed to handle admin-created inquiries properly.';
