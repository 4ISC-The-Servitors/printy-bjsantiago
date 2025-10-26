-- Create helper function to format status for notifications
CREATE OR REPLACE FUNCTION format_order_status(status text) RETURNS text AS $$
BEGIN
  RETURN CASE status
    WHEN 'awaiting_payment' THEN 'Awaiting Payment'
    WHEN 'verifying_payment' THEN 'Verifying Payment'
    WHEN 'reupload_payment_proof' THEN 'Reupload Payment'
    WHEN 'processing' THEN 'Processing'
    WHEN 'for_delivery' THEN 'For Delivery'
    WHEN 'for_pickup' THEN 'For Pickup'
    WHEN 'completed' THEN 'Completed'
    WHEN 'cancelled' THEN 'Cancelled'
    ELSE status
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION format_ticket_status(status text) RETURNS text AS $$
BEGIN
  RETURN CASE status
    WHEN 'new' THEN 'New'
    WHEN 'under_review' THEN 'Under Review'
    WHEN 'pending_customer_reply' THEN 'Pending Customer Reply'
    WHEN 'pending_admin_reply' THEN 'Pending Admin Reply'
    WHEN 'resolved' THEN 'Resolved'
    WHEN 'closed' THEN 'Closed'
    ELSE status
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION format_quote_status(status text) RETURNS text AS $$
BEGIN
  RETURN CASE status
    WHEN 'active' THEN 'Active'
    WHEN 'spec_proposed' THEN 'Quote Sent'
    WHEN 'accepted' THEN 'Accepted'
    WHEN 'rejected' THEN 'Rejected'
    WHEN 'ended' THEN 'Ended'
    ELSE status
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update notify_order_events to use formatted status
CREATE OR REPLACE FUNCTION public.notify_order_events()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_sender_role text;
  customer_name text;
  formatted_status text;
BEGIN
  -- Determine sender role based on operation and updated_by field
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
    IF NEW.status IN ('verifying_payment', 'reupload_payment') THEN
      v_sender_role := 'customer';
    ELSE
      v_sender_role := 'admin';
    END IF;
  END IF;

  SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), 'Customer')
  INTO customer_name
  FROM public.customer 
  WHERE customer_id = NEW.customer_id;
  
  formatted_status := format_order_status(NEW.status);

  IF v_sender_role = 'admin' THEN
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    VALUES (
      NEW.customer_id,
      'order',
      NEW.order_id,
      'Order Update',
      'Your order #' || COALESCE(NEW.display_id, SUBSTRING(NEW.order_id::text, 1, 8)) || ' status changed to "' || formatted_status || '".',
      'info',
      'order'
    );
  END IF;

  IF v_sender_role = 'customer' THEN
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    SELECT c.customer_id, 'order', NEW.order_id,
           CASE WHEN NEW.status = 'verifying_payment' THEN 'Payment Proof Uploaded'
                WHEN NEW.status = 'reupload_payment' THEN 'Payment Proof Reuploaded'
                ELSE 'Order Update' END,
           CASE WHEN NEW.status = 'verifying_payment' THEN 'Payment proof uploaded for order #' || COALESCE(NEW.display_id, SUBSTRING(NEW.order_id::text, 1, 8)) || ' by ' || customer_name || '.'
                WHEN NEW.status = 'reupload_payment' THEN 'Payment proof reuploaded for order #' || COALESCE(NEW.display_id, SUBSTRING(NEW.order_id::text, 1, 8)) || ' by ' || customer_name || '.'
                ELSE 'Order #' || COALESCE(NEW.display_id, SUBSTRING(NEW.order_id::text, 1, 8)) || ' updated by ' || customer_name || ' (' || formatted_status || ').' END,
           'warning', 'order'
    FROM public.customer c
    WHERE c.customer_type = 'admin';
  END IF;

  RETURN NEW;
END;
$function$;

-- Update notify_ticket_events to use formatted status
CREATE OR REPLACE FUNCTION public.notify_ticket_events()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_sender_role text;
  customer_name text;
  formatted_status text;
BEGIN
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

-- Update notify_quote_events to use formatted status
CREATE OR REPLACE FUNCTION public.notify_quote_events()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_sender_role text;
  customer_name text;
  formatted_status text;
BEGIN
  IF NEW.status IN ('accepted', 'rejected') THEN
    v_sender_role := 'customer';
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
  ELSIF TG_OP = 'INSERT' THEN
    v_sender_role := 'customer';
  ELSE
    v_sender_role := 'admin';
  END IF;

  SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), 'Customer')
  INTO customer_name
  FROM public.customer
  WHERE customer_id = NEW.customer_id;
  
  formatted_status := format_quote_status(NEW.status);

  IF v_sender_role = 'admin' THEN
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    VALUES (
      NEW.customer_id,
      'quote',
      NEW.quote_id,
      'Quote Update',
      'Your quote #' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8)) || ' is now "' || formatted_status || '".',
      'info',
      'quote'
    );
  END IF;

  IF v_sender_role = 'customer' THEN
    INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
    SELECT c.customer_id, 'quote', NEW.quote_id,
           CASE WHEN NEW.status = 'accepted' THEN 'Quote Accepted'
                WHEN NEW.status = 'rejected' THEN 'Quote Rejected'
                ELSE 'Quote Event' END,
           CASE WHEN NEW.status = 'accepted' THEN 'Quote #' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8)) || ' was accepted by ' || customer_name || '.'
                WHEN NEW.status = 'rejected' THEN 'Quote #' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8)) || ' was rejected by ' || customer_name || '.'
                ELSE 'Quote #' || COALESCE(NEW.display_id, SUBSTRING(NEW.quote_id::text, 1, 8)) || ' updated by ' || customer_name || ' (' || formatted_status || ').' END,
           'warning', 'quote'
    FROM public.customer c
    WHERE c.customer_type = 'admin';
  END IF;

  RETURN NEW;
END;
$function$;