-- Temporarily fix the message insertion to work without encryption
-- This is a quick fix to get the ask-quote flow working

-- Update the RPC function to store plain text temporarily
CREATE OR REPLACE FUNCTION api_insert_chat_message_v2(
  p_session_id uuid,
  p_text text,
  p_role text,
  p_node_id text default null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id uuid;
  v_customer_id uuid;
BEGIN
  -- Get session customer_id
  SELECT customer_id INTO v_customer_id
  FROM public.chat_sessions_v2
  WHERE session_id = p_session_id;

  -- Check authorization
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'session not found';
  END IF;

  IF NOT (v_customer_id = auth.uid() OR priv.is_admin()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Insert message as plain text (temporarily)
  INSERT INTO public.chat_messages_v2 (
    session_id,
    sender_role,
    message_text_enc,
    metadata
  )
  VALUES (
    p_session_id,
    p_role,
    p_text::bytea,  -- Store as bytea without encryption
    jsonb_build_object('node_id', p_node_id)
  )
  RETURNING message_id INTO v_message_id;

  RETURN jsonb_build_object('message_id', v_message_id);
END;
$$;

-- Also fix the fetch messages function to work without encryption
CREATE OR REPLACE FUNCTION api_fetch_chat_messages_v2(p_session_id uuid)
RETURNS TABLE (
  message_id uuid,
  sender_role text,
  message_text text,
  sent_at timestamptz,
  node_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
BEGIN
  -- Get session customer_id
  SELECT customer_id INTO v_customer_id
  FROM public.chat_sessions_v2
  WHERE session_id = p_session_id;

  -- Check authorization
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'session not found';
  END IF;

  IF NOT (v_customer_id = auth.uid() OR priv.is_admin()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Return messages (plain text, no decryption needed)
  RETURN QUERY
  SELECT
    m.message_id,
    m.sender_role,
    convert_from(m.message_text_enc, 'UTF8') as message_text,  -- Convert bytea to text
    m.sent_at,
    (m.metadata->>'node_id')::text as node_id
  FROM public.chat_messages_v2 m
  WHERE m.session_id = p_session_id
  ORDER BY m.sent_at ASC;
END;
$$;