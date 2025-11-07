-- Migration 101: Remove INSERT handling from notify_quote_events
-- Quote creation notifications are now handled by notify_admins_on_quote_created
-- This prevents duplicate notifications

-- Update the trigger function to skip INSERT operations
CREATE OR REPLACE FUNCTION public.notify_quote_events()
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
  -- Skip INSERT operations - quote creation is handled by notify_admins_on_quote_created
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Determine sender role based on status and updated_by
  -- If status is accepted/rejected, it's always customer-initiated
  IF NEW.status IN ('accepted', 'rejected') THEN
    v_sender_role := 'customer';
  -- For other statuses, check updated_by
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
  -- Default fallback for updates without updated_by
  ELSE
    v_sender_role := 'admin';
  END IF;

  -- Resolve display name for customer
  SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), 'Customer')
  INTO customer_name
  FROM public.customer
  WHERE customer_id = NEW.customer_id;

  -- Format status using formatter function
  formatted_status := format_quote_status(NEW.status);

  -- Admin-initiated → notify customer only
  IF v_sender_role = 'admin' THEN
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    VALUES (
      NEW.customer_id,
      'quote',
      NEW.quote_id,
      'Quote Update',
      'Your quote ' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8)) || ' is now ' || formatted_status || '.',
      'info',
      'quote'
    );
  END IF;

  -- Customer-initiated → notify admins only
  IF v_sender_role = 'customer' THEN
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    SELECT c.customer_id, 'quote', NEW.quote_id,
           CASE WHEN NEW.status = 'accepted' THEN 'Quote Accepted'
                WHEN NEW.status = 'rejected' THEN 'Quote Rejected'
                ELSE 'Quote Update' END,
           CASE WHEN NEW.status = 'accepted' THEN 'Quote ' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8)) || ' was accepted by ' || customer_name || '.'
                WHEN NEW.status = 'rejected' THEN 'Quote ' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8)) || ' was rejected by ' || customer_name || '.'
                ELSE 'Quote ' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8)) || ' updated by ' || customer_name || ' (' || formatted_status || ').' END,
           'warning', 'quote'
    FROM public.customer c
    WHERE c.customer_type = 'admin';
  END IF;

  RETURN NEW;
END;
$function$;

-- Drop old duplicate trigger that might exist
DROP TRIGGER IF EXISTS trg_quote_created_notifications ON public.quotes;

-- Update the trigger to only fire on UPDATE (INSERT is handled by notify_admins_on_quote_created)
DROP TRIGGER IF EXISTS trigger_quote_notifications ON public.quotes;
DROP TRIGGER IF EXISTS trigger_notify_quote_events ON public.quotes;
CREATE TRIGGER trigger_quote_notifications
AFTER UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.notify_quote_events();

-- Add comment for documentation
COMMENT ON FUNCTION public.notify_quote_events() IS 
'Notifies users about quote UPDATE changes only. INSERT operations are handled by notify_admins_on_quote_created. Uses SECURITY DEFINER to bypass RLS.';

