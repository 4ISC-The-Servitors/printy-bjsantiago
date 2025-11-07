-- Migration 098: Enhance ticket notification trigger to handle all update scenarios
-- This replaces hardcoded notifications in application code
-- Handles: admin status changes, customer replies, admin replies, customer resolution

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
  ticket_display_id text;
BEGIN
  -- Skip INSERT operations - ticket creation is handled by notify_admins_on_ticket_create
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- For UPDATE operations, only proceed if status actually changed
  IF TG_OP = 'UPDATE' AND OLD.inquiry_status = NEW.inquiry_status THEN
    RETURN NEW;
  END IF;

  -- Get ticket display_id
  ticket_display_id := COALESCE(NEW.display_id, SUBSTRING(NEW.inquiry_id::text, 1, 8));

  -- Get customer name
  SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), 'Customer')
  INTO customer_name
  FROM public.customer 
  WHERE customer_id = NEW.customer_id;

  -- Format status
  formatted_status := format_ticket_status(NEW.inquiry_status);

  -- Determine sender role based on updated_by field
  IF NEW.updated_by IS NOT NULL THEN
    -- Check if updated_by is the customer themselves
    IF NEW.updated_by = NEW.customer_id THEN
      v_sender_role := 'customer';
    ELSE
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
    END IF;
  ELSE
    -- Fallback: determine by status
    IF NEW.inquiry_status IN ('under_review', 'resolved', 'closed') THEN
      v_sender_role := 'admin';
    ELSIF NEW.inquiry_status IN ('pending_customer_reply') THEN
      v_sender_role := 'admin'; -- Admin replied, notify customer
    ELSIF NEW.inquiry_status IN ('pending_admin_reply') THEN
      v_sender_role := 'customer'; -- Customer replied, notify admins
    ELSE
      v_sender_role := 'admin';
    END IF;
  END IF;

  -- Admin actions notify customer
  IF v_sender_role = 'admin' THEN
    -- Admin status changes (under_review, resolved, closed) or admin replies (pending_customer_reply)
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    VALUES (
      NEW.customer_id,
      'ticket',
      NEW.inquiry_id,
      'Ticket Update',
      CASE 
        WHEN NEW.inquiry_status = 'pending_customer_reply' THEN
          'Admin replied to your ticket ' || ticket_display_id || '.'
        ELSE
          'Your ticket ' || ticket_display_id || ' status changed to ' || formatted_status || '.'
      END,
      CASE 
        WHEN NEW.inquiry_status = 'resolved' THEN 'success'
        ELSE 'info'
      END,
      'ticket'
    );
  END IF;

  -- Customer actions notify admins
  IF v_sender_role = 'customer' THEN
    -- Customer replies (pending_admin_reply) or customer resolves (resolved)
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    SELECT c.customer_id, 'ticket', NEW.inquiry_id,
           'Ticket Update',
           CASE 
             WHEN NEW.inquiry_status = 'resolved' THEN
               'Ticket ' || ticket_display_id || ' was marked as resolved by ' || customer_name || '.'
             WHEN NEW.inquiry_status = 'pending_admin_reply' THEN
               'Customer ' || customer_name || ' replied to ticket ' || ticket_display_id || '.'
             ELSE
               'Ticket ' || ticket_display_id || ' updated by ' || customer_name || ' (' || formatted_status || ').'
           END,
           CASE 
             WHEN NEW.inquiry_status = 'resolved' THEN 'success'
             ELSE 'info'
           END,
           'ticket'
    FROM public.customer c
    WHERE c.customer_type = 'admin';
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists and fires on UPDATE
DROP TRIGGER IF EXISTS trigger_ticket_notifications_v2 ON public.inquiries_v2;
CREATE TRIGGER trigger_ticket_notifications_v2
AFTER UPDATE ON public.inquiries_v2
FOR EACH ROW
EXECUTE FUNCTION public.notify_ticket_events();

-- Add comment for documentation
COMMENT ON FUNCTION public.notify_ticket_events() IS 
'Handles all ticket UPDATE notifications: admin status changes notify customer, customer replies/resolutions notify admins. Uses SECURITY DEFINER to bypass RLS.';

