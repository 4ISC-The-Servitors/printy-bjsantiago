-- Migration 080: Add trigger for quote_proposals accept/reject notifications
-- This ensures admins get notified when customers accept or reject quote proposals

CREATE OR REPLACE FUNCTION public.notify_quote_proposal_accept_reject()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  customer_name text;
  quote_display_id text;
BEGIN
  -- Only trigger on status changes to 'accepted' or 'rejected'
  IF NEW.status NOT IN ('accepted', 'rejected') THEN
    RETURN NEW;
  END IF;

  -- Only trigger if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get customer name from session_id
  SELECT COALESCE(NULLIF(TRIM(c.first_name || ' ' || c.last_name), ''), 'Customer')
  INTO customer_name
  FROM public.customer c
  JOIN public.quotes q ON q.session_id = NEW.session_id
  WHERE q.session_id = NEW.session_id;

  -- Get quote display_id for the message
  SELECT q.display_id
  INTO quote_display_id
  FROM public.quotes q
  WHERE q.session_id = NEW.session_id;

  -- Notify all admins about quote proposal acceptance/rejection
  INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
  SELECT c.customer_id, 'quote', NEW.proposal_id,
         CASE WHEN NEW.status = 'accepted' THEN 'Quote Accepted'
              WHEN NEW.status = 'rejected' THEN 'Quote Rejected'
              ELSE 'Quote Update' END,
         CASE WHEN NEW.status = 'accepted' THEN 'Quote Accepted - ' || COALESCE(quote_display_id, SUBSTRING(NEW.proposal_id::text, 1, 8))
              WHEN NEW.status = 'rejected' THEN 'Quote Rejected - ' || COALESCE(quote_display_id, SUBSTRING(NEW.proposal_id::text, 1, 8))
              ELSE 'Quote Update - ' || COALESCE(quote_display_id, SUBSTRING(NEW.proposal_id::text, 1, 8)) END,
         'warning', 'quote'
  FROM public.customer c
  WHERE c.customer_type = 'admin';

  RETURN NEW;
END;
$function$;

-- Create trigger for quote_proposals accept/reject notifications
DROP TRIGGER IF EXISTS trigger_quote_proposal_accept_reject_notifications ON public.quote_proposals CASCADE;
CREATE TRIGGER trigger_quote_proposal_accept_reject_notifications
AFTER UPDATE ON public.quote_proposals
FOR EACH ROW
EXECUTE FUNCTION public.notify_quote_proposal_accept_reject();
