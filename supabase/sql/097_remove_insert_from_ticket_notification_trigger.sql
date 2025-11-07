-- Migration 097: Remove INSERT handling from notify_ticket_events
-- Ticket creation notifications are now handled by notify_admins_on_ticket_create
-- This prevents duplicate "New Support Ticket" notifications

-- Update the trigger function to skip INSERT operations
CREATE OR REPLACE FUNCTION public.notify_ticket_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_sender_role text;
  customer_name text;
  formatted_status text;
BEGIN
  -- Skip INSERT operations - ticket creation is handled by notify_admins_on_ticket_create
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- For UPDATE operations, only proceed if status actually changed
  IF TG_OP = 'UPDATE' AND OLD.inquiry_status = NEW.inquiry_status THEN
    RETURN NEW;
  END IF;

  -- Determine sender role for UPDATE operations
  IF NEW.updated_by IS NOT NULL THEN
    IF NEW.updated_by = NEW.customer_id THEN
      v_sender_role := 'customer';
    ELSE
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
  ELSE
    IF NEW.inquiry_status IN ('under_review', 'resolved', 'closed') THEN
      v_sender_role := 'admin';
    ELSIF NEW.inquiry_status IN ('pending_customer_reply') THEN
      v_sender_role := 'customer';
    ELSE
      v_sender_role := 'admin';
    END IF;
  END IF;

  SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), 'Customer')
  INTO customer_name
  FROM public.customer 
  WHERE customer_id = NEW.customer_id;
  
  formatted_status := format_ticket_status(NEW.inquiry_status);

  IF v_sender_role = 'admin' THEN
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    VALUES (
      NEW.customer_id,
      'ticket',
      NEW.inquiry_id,
      'Ticket Update',
      'Your ticket ' || COALESCE(NEW.display_id, SUBSTRING(NEW.inquiry_id::text, 1, 8)) || ' status changed to ' || formatted_status || '.',
      'info',
      'ticket'
    );
  END IF;

  IF v_sender_role = 'customer' THEN
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    SELECT c.customer_id, 'ticket', NEW.inquiry_id,
           'Ticket Update',
           'Ticket ' || COALESCE(NEW.display_id, SUBSTRING(NEW.inquiry_id::text, 1, 8)) || ' updated by ' || customer_name || ' (' || formatted_status || ').',
           'warning', 'ticket'
    FROM public.customer c
    WHERE c.customer_type = 'admin';
  END IF;

  RETURN NEW;
END;
$function$;

-- Update the trigger to only fire on UPDATE (INSERT is handled by notify_admins_on_ticket_create)
DROP TRIGGER IF EXISTS trigger_ticket_notifications_v2 ON public.inquiries_v2;
CREATE TRIGGER trigger_ticket_notifications_v2
AFTER UPDATE ON public.inquiries_v2
FOR EACH ROW
EXECUTE FUNCTION public.notify_ticket_events();

-- Add comment for documentation
COMMENT ON FUNCTION public.notify_ticket_events() IS 
'Notifies users about ticket UPDATE changes only. INSERT operations are handled by notify_admins_on_ticket_create. Uses SECURITY DEFINER to bypass RLS.';

