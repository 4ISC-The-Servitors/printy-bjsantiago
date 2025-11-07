-- Migration 088: Add SECURITY DEFINER to notification trigger functions
-- This allows trigger functions to bypass RLS when inserting notifications
-- Fixes RLS policy violations when customers/admins trigger notifications

-- Fix notify_quote_events
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

-- Fix notify_ticket_events
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

-- Fix notify_order_events
CREATE OR REPLACE FUNCTION public.notify_order_events()
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

-- Fix notify_payment_events
CREATE OR REPLACE FUNCTION public.notify_payment_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Get order and customer info from related tables
  INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
  SELECT 
    o.customer_id,
    'payment',
    NEW.payment_id,
    'Payment Update',
    'Payment for order #' || COALESCE(o.display_id, o.order_id::text) || ' is now "' || NEW.payment_status || '".',
    CASE
      WHEN NEW.payment_status = 'approved' THEN 'success'
      WHEN NEW.payment_status = 'rejected' THEN 'error'
      ELSE 'info'
    END,
    'payment'
  FROM orders o
  WHERE o.order_id = NEW.order_id;

  -- Notify admins
  INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
  SELECT 
    c.customer_id, 
    'payment', 
    NEW.payment_id,
    'Payment Event',
    'Payment for order #' || COALESCE(o.display_id, o.order_id::text) || ' status changed to "' || NEW.payment_status || '".',
    'warning', 
    'payment'
  FROM customer c
  CROSS JOIN orders o
  WHERE c.customer_type = 'admin' 
  AND o.order_id = NEW.order_id;

  RETURN NEW;
END;
$function$;

-- Fix notify_customer_on_proposal_update
CREATE OR REPLACE FUNCTION public.notify_customer_on_proposal_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_customer_id uuid;
  v_quote_id uuid;
BEGIN
  -- Resolve customer and quote via session
  SELECT cs.customer_id, cs.quote_id INTO v_customer_id, v_quote_id
  FROM public.chat_sessions_v2 cs
  WHERE cs.session_id = NEW.session_id;

  IF v_customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only notify when admin sends a proposal
  IF NEW.status = 'sent' THEN
    INSERT INTO public.notifications (customer_id, source_type, source_id, title, message, type, category)
    VALUES (
      v_customer_id,
      'quote',
      COALESCE(v_quote_id, NEW.spec_id),
      'New quote proposal',
      'A new quote proposal has been sent. Please review the details.',
      'info',
      'quote'
    );
  END IF;

  -- For other statuses (accepted/rejected/etc.), rely on quotes trigger notify_quote_events
  RETURN NEW;
END;
$function$;

-- Fix notify_customer_on_quote_update
CREATE OR REPLACE FUNCTION public.notify_customer_on_quote_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only trigger on status changes to 'spec_proposed' (when admin sends specs)
  IF NEW.status NOT IN ('spec_proposed') THEN
    RETURN NEW;
  END IF;

  -- Only trigger if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Notify the customer about the quote update
  INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
  VALUES (
    NEW.customer_id,  -- Use NEW.customer_id directly (it's already UUID)
    'quote',
    NEW.quote_id,
    'Quote Sent',
    'Your quote ' || COALESCE(NEW.display_id, '#' || SUBSTRING(NEW.quote_id::text, 1, 8)) || ' already has a quote price.',
    'info',
    'quote'
  );

  RETURN NEW;
END;
$function$;

-- Fix notify_quote_accept_reject
CREATE OR REPLACE FUNCTION public.notify_quote_accept_reject()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix notify_quote_proposal_accept_reject
CREATE OR REPLACE FUNCTION public.notify_quote_proposal_accept_reject()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create RPC function to insert admin notifications (for use from application code)
CREATE OR REPLACE FUNCTION public.insert_admin_notifications(
  p_notifications jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Insert notifications for admins
  -- This function bypasses RLS so it can insert notifications for any user
  INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
  SELECT 
    (notification->>'customer_id')::uuid,
    notification->>'source_type',
    (notification->>'source_id')::uuid,
    notification->>'title',
    notification->>'message',
    notification->>'type',
    notification->>'category'
  FROM jsonb_array_elements(p_notifications) AS notification;
END;
$function$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_admin_notifications(jsonb) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION notify_quote_events() IS 'Notifies users about quote changes. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION notify_ticket_events() IS 'Notifies users about ticket changes. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION notify_order_events() IS 'Notifies users about order changes. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION notify_payment_events() IS 'Notifies users about payment changes. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION notify_customer_on_proposal_update() IS 'Notifies customer when proposal is sent. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION notify_customer_on_quote_update() IS 'Notifies customer when quote status changes. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION notify_quote_accept_reject() IS 'Notifies admins when quotes are accepted/rejected. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION notify_quote_proposal_accept_reject() IS 'Notifies admins when quote proposals are accepted/rejected. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION insert_admin_notifications(jsonb) IS 'RPC function to insert notifications for admins. Uses SECURITY DEFINER to bypass RLS. For use from application code.';

