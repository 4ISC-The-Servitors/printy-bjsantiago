-- Migration 077: Fix notify_admins_on_quote_created function
-- Remove customer notification - only admins should be notified when customer creates quote

DROP FUNCTION IF EXISTS public.notify_admins_on_quote_created() CASCADE;

CREATE OR REPLACE FUNCTION public.notify_admins_on_quote_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  -- Fan-out to all admins only (remove customer notification)
  insert into notifications (id, customer_id, title, message, type, category, is_read, created_at)
  select gen_random_uuid(),
         c.customer_id,
         'New quote created',
         'Quote ' || coalesce(new.display_id, new.quote_id::text) || ' was submitted by a customer.',
         'info',
         'quote',
         false,
         now()
  from customer c
  where c.customer_type = 'admin';

  return new;
end;
$function$;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS trg_quote_created_notifications ON public.quotes CASCADE;
CREATE TRIGGER trg_quote_created_notifications
AFTER INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_quote_created();
