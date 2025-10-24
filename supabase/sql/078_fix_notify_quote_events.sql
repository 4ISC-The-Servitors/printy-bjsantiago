-- Migration 078: Fix notify_quote_events function
-- Remove superadmin references and ensure proper role-based notifications

DROP FUNCTION IF EXISTS public.notify_quote_events() CASCADE;

CREATE OR REPLACE FUNCTION public.notify_quote_events()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_sender_role text;
  customer_name text;
BEGIN
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
  -- If updated_by is null and it's an INSERT, assume customer created it
  ELSIF TG_OP = 'INSERT' THEN
    v_sender_role := 'customer';
  -- Default fallback for updates without updated_by
  ELSE
    v_sender_role := 'admin';
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
      'quote',
      NEW.quote_id,
      'Quote Update',
      'Your quote #' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8)) || ' is now "' || NEW.status || '".',
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
                ELSE 'Quote Event' END,
           CASE WHEN NEW.status = 'accepted' THEN 'Quote #' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8)) || ' was accepted by ' || customer_name || '.'
                WHEN NEW.status = 'rejected' THEN 'Quote #' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8)) || ' was rejected by ' || customer_name || '.'
                ELSE 'Quote #' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8)) || ' updated by ' || customer_name || ' (' || NEW.status || ').' END,
           'warning', 'quote'
    FROM public.customer c
    WHERE c.customer_type = 'admin';
  END IF;

  RETURN NEW;
END;
$function$;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS trigger_quote_notifications ON public.quotes CASCADE;
CREATE TRIGGER trigger_quote_notifications
AFTER INSERT OR UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.notify_quote_events();
