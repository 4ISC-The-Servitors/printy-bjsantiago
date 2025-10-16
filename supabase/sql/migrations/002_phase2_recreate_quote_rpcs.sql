-- Migration: Phase 2 - Recreate quote RPCs to use chat_sessions_v2 and chat_messages_v2
-- Purpose: Redirect quote operations to the unified chat tables

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS create_quote_conversation(uuid, uuid);
DROP FUNCTION IF EXISTS add_quote_message(uuid, uuid, text, text, text, jsonb);

-- ============================================================================
-- Function: create_quote_conversation
-- Recreated to insert into chat_sessions_v2 instead of quote_conversations
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_quote_conversation(
  p_customer_id uuid, 
  p_quote_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_display_id TEXT;
  v_final_quote_id UUID;
BEGIN
  -- Use provided quote_id or generate new one
  v_final_quote_id := COALESCE(p_quote_id, gen_random_uuid());
  
  -- Generate display_id using existing sequence
  v_display_id := 'QOT-' || LPAD(nextval('quote_display_seq')::text, 6, '0');
  
  -- Insert into chat_sessions_v2 with quote metadata
  INSERT INTO chat_sessions_v2 (
    customer_id,
    flow_id,
    status,
    metadata
  )
  VALUES (
    p_customer_id,
    'ask-quote',
    'active',
    jsonb_build_object(
      'quote', jsonb_build_object(
        'display_id', v_display_id,
        'quote_id', v_final_quote_id,
        'status', 'active',
        'created_at', now()
      )
    )
  )
  RETURNING session_id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$;

COMMENT ON FUNCTION create_quote_conversation IS 'Creates a new quote session in chat_sessions_v2 with quote metadata. Returns session_id (not conversation_id).';

-- ============================================================================
-- Function: add_quote_message
-- Recreated to insert into chat_messages_v2 with encryption
-- ============================================================================
CREATE OR REPLACE FUNCTION public.add_quote_message(
  p_conversation_id uuid,  -- now expects session_id
  p_sender_id uuid,
  p_sender_role text,
  p_message_text text,
  p_message_type text DEFAULT 'chat',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id UUID;
  v_key TEXT;
  v_merged_metadata JSONB;
BEGIN
  -- Get encryption key
  v_key := current_setting('app.encryption_key', true);
  IF v_key IS NULL THEN
    v_key := 'default-encryption-key-change-in-production';
  END IF;

  -- Merge provided metadata with quote-specific fields
  v_merged_metadata := p_metadata || jsonb_build_object(
    'quote', jsonb_build_object('type', p_message_type)
  );

  -- Insert encrypted message into chat_messages_v2
  INSERT INTO chat_messages_v2 (
    session_id,
    sender_role,
    message_text_enc,
    metadata
  )
  VALUES (
    p_conversation_id,  -- session_id
    p_sender_role,
    pgp_sym_encrypt(p_message_text, v_key),
    v_merged_metadata
  )
  RETURNING message_id INTO v_message_id;
  
  -- Update session metadata updated_at (optional enhancement)
  UPDATE chat_sessions_v2 
  SET metadata = jsonb_set(
    metadata, 
    '{quote,updated_at}', 
    to_jsonb(now())
  )
  WHERE session_id = p_conversation_id;
  
  RETURN v_message_id;
END;
$$;

COMMENT ON FUNCTION add_quote_message IS 'Adds an encrypted message to a quote session in chat_messages_v2. p_conversation_id is now session_id.';

-- ============================================================================
-- Function: get_quote_messages_v2
-- New function to fetch quote messages from chat_messages_v2
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_quote_messages_v2(p_session_id uuid)
RETURNS TABLE(
  message_id uuid,
  sender_role text,
  message_text text,
  message_type text,
  metadata jsonb,
  sent_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key TEXT;
BEGIN
  -- Get encryption key
  v_key := current_setting('app.encryption_key', true);
  IF v_key IS NULL THEN
    v_key := 'default-encryption-key-change-in-production';
  END IF;

  RETURN QUERY
  SELECT
    m.message_id,
    m.sender_role,
    pgp_sym_decrypt(m.message_text_enc, v_key) AS message_text,
    COALESCE(m.metadata->'quote'->>'type', 'chat') AS message_type,
    m.metadata,
    m.sent_at
  FROM chat_messages_v2 m
  WHERE m.session_id = p_session_id
  ORDER BY m.sent_at ASC;
END;
$$;

COMMENT ON FUNCTION get_quote_messages_v2 IS 'Fetches decrypted quote messages from chat_messages_v2 for a given session_id.';

-- ============================================================================
-- Function: get_quote_session_by_display_id
-- Helper to look up session by quote display_id
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_quote_session_by_display_id(p_display_id text)
RETURNS TABLE(
  session_id uuid,
  customer_id uuid,
  display_id text,
  status text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.session_id,
    s.customer_id,
    (s.metadata->'quote'->>'display_id')::TEXT AS display_id,
    (s.metadata->'quote'->>'status')::TEXT AS status,
    s.created_at
  FROM chat_sessions_v2 s
  WHERE s.metadata->'quote'->>'display_id' = p_display_id
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_quote_session_by_display_id IS 'Looks up a quote session by its human-readable display_id (e.g., QOT-300001).';

