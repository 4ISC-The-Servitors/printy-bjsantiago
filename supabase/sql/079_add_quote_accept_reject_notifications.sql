-- Migration 079: Add dedicated trigger for quote accept/reject notifications
-- This ensures admins get notified when customers accept or reject quotes

CREATE OR REPLACE FUNCTION public.notify_quote_accept_reject()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  customer_name text;
BEGIN
  -- Only trigger on status changes to 'accepted' or 'rejected'
  IF NEW.status NOT IN ('accepted', 'rejected') THEN
    RETURN NEW;
  END IF;

  -- Only trigger if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Resolve display name for customer
  SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), 'Customer')
  INTO customer_name
  FROM public.customer
  WHERE customer_id = NEW.customer_id;

  -- Notify all admins about quote acceptance/rejection
  INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
  SELECT c.customer_id, 'quote', NEW.quote_id,
         CASE WHEN NEW.status = 'accepted' THEN 'Quote Accepted'
              WHEN NEW.status = 'rejected' THEN 'Quote Rejected'
              ELSE 'Quote Update' END,
         CASE WHEN NEW.status = 'accepted' THEN 'Quote Accepted - ' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8))
              WHEN NEW.status = 'rejected' THEN 'Quote Rejected - ' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8))
              ELSE 'Quote Update - ' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8)) END,
         'warning', 'quote'
  FROM public.customer c
  WHERE c.customer_type = 'admin';

  RETURN NEW;
END;
$function$;

-- Create trigger for quote accept/reject notifications
DROP TRIGGER IF EXISTS trigger_quote_accept_reject_notifications ON public.quotes CASCADE;
CREATE TRIGGER trigger_quote_accept_reject_notifications
AFTER UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.notify_quote_accept_reject();
