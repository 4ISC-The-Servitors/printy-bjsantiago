-- Migration 096: Create notify_admins_on_ticket_create trigger function
-- This handles notifications when customers create tickets via database trigger
-- Uses SECURITY DEFINER to bypass RLS, similar to notify_admins_on_quote_created

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.notify_admins_on_ticket_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if customer is valued (for urgent notifications)
  IF EXISTS (
    SELECT 1 FROM public.customer vc
    WHERE vc.customer_id = NEW.customer_id
      AND vc.customer_type = 'valued'
  ) THEN
    -- Valued customer - send urgent notification
    INSERT INTO notifications (id, customer_id, source_type, source_id, title, message, type, category, is_read, created_at)
    SELECT gen_random_uuid(),
           c.customer_id,
           'ticket',
           NEW.inquiry_id,
           'Urgent Support Ticket',
           'New support ticket ' || COALESCE(NEW.display_id, NEW.inquiry_id::text) || ' was created by ' || (
             SELECT TRIM(first_name || ' ' || last_name)
             FROM public.customer
             WHERE customer_id = NEW.customer_id
           ) || '.',
           'warning',
           'ticket',
           false,
           now()
    FROM public.customer c
    WHERE c.customer_type = 'admin';
  ELSE
    -- Regular customer - send standard notification
    INSERT INTO notifications (id, customer_id, source_type, source_id, title, message, type, category, is_read, created_at)
    SELECT gen_random_uuid(),
           c.customer_id,
           'ticket',
           NEW.inquiry_id,
           'New Support Ticket',
           'New support ticket ' || COALESCE(NEW.display_id, NEW.inquiry_id::text) || ' was created by ' || (
             SELECT TRIM(first_name || ' ' || last_name)
             FROM public.customer
             WHERE customer_id = NEW.customer_id
           ) || '.',
           'warning',
           'ticket',
           false,
           now()
    FROM public.customer c
    WHERE c.customer_type = 'admin';
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on inquiries_v2 table
DROP TRIGGER IF EXISTS trigger_notify_admins_on_ticket_create ON public.inquiries_v2;
CREATE TRIGGER trigger_notify_admins_on_ticket_create
AFTER INSERT ON public.inquiries_v2
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_ticket_create();

-- Add comment for documentation
COMMENT ON FUNCTION public.notify_admins_on_ticket_create() IS 
'Notifies all admins when a new ticket is created. Uses SECURITY DEFINER to bypass RLS. Similar to notify_admins_on_quote_created.';

