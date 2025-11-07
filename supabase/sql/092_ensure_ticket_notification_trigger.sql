-- Migration 092: Ensure ticket notification trigger exists and is properly configured
-- This fixes broken notifications when admin changes ticket status

-- Ensure the trigger function exists with SECURITY DEFINER (from migration 088)
-- This function should already exist, but we'll ensure it's correct
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
  -- For UPDATE operations, only proceed if status actually changed
  IF TG_OP = 'UPDATE' AND OLD.inquiry_status = NEW.inquiry_status THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.updated_by IS NOT NULL THEN
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
      v_sender_role := 'customer';
    END IF;
  ELSIF NEW.updated_by IS NOT NULL THEN
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
      'Your support ticket #' || COALESCE(NEW.display_id, SUBSTRING(NEW.inquiry_id::text, 1, 8)) || ' status changed to "' || formatted_status || '".',
      'info',
      'ticket'
    );
  END IF;

  IF v_sender_role = 'customer' THEN
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    SELECT c.customer_id, 'ticket', NEW.inquiry_id,
           CASE WHEN TG_OP = 'INSERT' THEN 'New Support Ticket'
                ELSE 'Ticket Update' END,
           CASE WHEN TG_OP = 'INSERT' THEN 'New support ticket #' || COALESCE(NEW.display_id, SUBSTRING(NEW.inquiry_id::text, 1, 8)) || ' created by ' || customer_name || '.'
                ELSE 'Support ticket #' || COALESCE(NEW.display_id, SUBSTRING(NEW.inquiry_id::text, 1, 8)) || ' updated by ' || customer_name || ' (' || formatted_status || ').' END,
           'warning', 'ticket'
    FROM public.customer c
    WHERE c.customer_type = 'admin';
  END IF;

  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists (to recreate it)
DROP TRIGGER IF EXISTS trigger_ticket_notifications_v2 ON public.inquiries_v2;

-- Create the trigger for inquiries_v2 table
CREATE TRIGGER trigger_ticket_notifications_v2
AFTER INSERT OR UPDATE ON public.inquiries_v2
FOR EACH ROW
EXECUTE FUNCTION public.notify_ticket_events();

-- Add comment for documentation
COMMENT ON FUNCTION public.notify_ticket_events() IS 'Notifies users about ticket changes. Uses SECURITY DEFINER to bypass RLS. Admin actions notify customers, customer actions notify admins.';

