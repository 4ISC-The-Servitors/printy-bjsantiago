-- Migration 100: Create trigger for notify_admins_on_quote_created
-- This ensures admins are notified when customers create quotes via database trigger
-- Similar to notify_admins_on_ticket_create

-- Ensure the function exists with SECURITY DEFINER and proper structure
CREATE OR REPLACE FUNCTION public.notify_admins_on_quote_created()
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
           'quote',
           NEW.quote_id,
           'Urgent Quote Request',
           'Quote ' || COALESCE(NEW.display_id, NEW.quote_id::text) || ' was submitted by ' || (
             SELECT TRIM(first_name || ' ' || last_name)
             FROM public.customer
             WHERE customer_id = NEW.customer_id
           ) || '.',
           'warning',
           'quote',
           false,
           now()
    FROM public.customer c
    WHERE c.customer_type = 'admin';
  ELSE
    -- Regular customer - send standard notification
    INSERT INTO notifications (id, customer_id, source_type, source_id, title, message, type, category, is_read, created_at)
    SELECT gen_random_uuid(),
           c.customer_id,
           'quote',
           NEW.quote_id,
           'Quote Request',
           'Quote ' || COALESCE(NEW.display_id, NEW.quote_id::text) || ' was submitted by ' || (
             SELECT TRIM(first_name || ' ' || last_name)
             FROM public.customer
             WHERE customer_id = NEW.customer_id
           ) || '.',
           'info',
           'quote',
           false,
           now()
    FROM public.customer c
    WHERE c.customer_type = 'admin';
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on quotes table
DROP TRIGGER IF EXISTS trigger_notify_admins_on_quote_created ON public.quotes;
CREATE TRIGGER trigger_notify_admins_on_quote_created
AFTER INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_quote_created();

-- Add comment for documentation
COMMENT ON FUNCTION public.notify_admins_on_quote_created() IS 
'Notifies all admins when a new quote is created. Uses SECURITY DEFINER to bypass RLS. Similar to notify_admins_on_ticket_create.';

