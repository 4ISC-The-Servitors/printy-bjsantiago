-- ============================================================================
-- JSONB Chat Flow System V2 - Database Schema
-- Based on: docs_guide/JSONB_CHAT_FLOW_SYSTEM.md
-- ============================================================================

-- Table 1: chat_flows_v2 - Flow Definitions
-- One row = one complete chat flow stored as JSONB
CREATE TABLE IF NOT EXISTS chat_flows_v2 (
  flow_id TEXT PRIMARY KEY,
  flow_definition JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE chat_flows_v2 IS 'Stores complete chat flow definitions as JSONB documents';
COMMENT ON COLUMN chat_flows_v2.flow_id IS 'Unique identifier for the flow (e.g., ask-quote, issue-ticket)';
COMMENT ON COLUMN chat_flows_v2.flow_definition IS 'Complete flow definition including all nodes, options, and actions';
COMMENT ON COLUMN chat_flows_v2.active IS 'Whether this flow is currently available to users';

-- Table 2: chat_sessions_v2 - Active Conversations
-- One row = one conversation between a user and Printy
CREATE TABLE IF NOT EXISTS chat_sessions_v2 (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id TEXT REFERENCES chat_flows_v2(flow_id),
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE chat_sessions_v2 IS 'Active and historical chat sessions';
COMMENT ON COLUMN chat_sessions_v2.metadata IS 'Session state: {current_node_id, context, quote_conversation_id, inquiry_id}';

CREATE INDEX IF NOT EXISTS idx_sessions_v2_customer ON chat_sessions_v2(customer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_v2_status ON chat_sessions_v2(status);
CREATE INDEX IF NOT EXISTS idx_sessions_v2_flow ON chat_sessions_v2(flow_id);

-- Table 3: chat_messages_v2 - Message History
-- One row = one message (from customer, admin, or printy)
CREATE TABLE IF NOT EXISTS chat_messages_v2 (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions_v2(session_id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'admin', 'printy')),
  message_text_enc BYTEA NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE chat_messages_v2 IS 'Encrypted message history for chat sessions';
COMMENT ON COLUMN chat_messages_v2.message_text_enc IS 'Encrypted message text (use pgcrypto)';
COMMENT ON COLUMN chat_messages_v2.metadata IS 'Message metadata: {node_id, has_attachment, attachment_url}';

CREATE INDEX IF NOT EXISTS idx_messages_v2_session ON chat_messages_v2(session_id, sent_at);

-- ============================================================================
-- RPC Functions for JSONB Chat System
-- ============================================================================

-- Function: Insert encrypted message (V2)
CREATE OR REPLACE FUNCTION api_insert_chat_message_v2(
  p_session_id UUID,
  p_text TEXT,
  p_role TEXT,
  p_node_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_message_id UUID;
  v_key TEXT;
BEGIN
  -- Get encryption key from vault (you need to set this up)
  -- For now, using a placeholder - in production, use Supabase Vault
  v_key := current_setting('app.encryption_key', true);
  IF v_key IS NULL THEN
    v_key := 'default-encryption-key-change-in-production';
  END IF;

  -- Insert encrypted message
  INSERT INTO chat_messages_v2 (
    session_id,
    sender_role,
    message_text_enc,
    metadata
  ) VALUES (
    p_session_id,
    p_role,
    pgp_sym_encrypt(p_text, v_key),
    jsonb_build_object('node_id', p_node_id)
  )
  RETURNING message_id INTO v_message_id;

  RETURN jsonb_build_object('message_id', v_message_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Fetch decrypted messages (V2)
CREATE OR REPLACE FUNCTION api_fetch_chat_messages_v2(
  p_session_id UUID
) RETURNS TABLE (
  message_id UUID,
  sender_role TEXT,
  message_text TEXT,
  sent_at TIMESTAMPTZ,
  node_id TEXT
) AS $$
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
    m.sent_at,
    (m.metadata->>'node_id')::TEXT AS node_id
  FROM chat_messages_v2 m
  WHERE m.session_id = p_session_id
  ORDER BY m.sent_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get flow definition by ID
CREATE OR REPLACE FUNCTION api_get_flow_definition(
  p_flow_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_definition JSONB;
  v_owner TEXT;
BEGIN
  SELECT flow_definition, COALESCE(flow_owner, 'customer') INTO v_definition, v_owner
  FROM chat_flows_v2
  WHERE flow_id = p_flow_id AND active = true;

  -- Merge DB-level owner as fallback when JSON lacks it
  IF v_definition IS NOT NULL THEN
    IF (v_definition ? 'owner') IS FALSE THEN
      v_definition := jsonb_set(v_definition, '{owner}', to_jsonb(v_owner::text), true);
    END IF;
  END IF;

  RETURN v_definition;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get active user sessions
CREATE OR REPLACE FUNCTION api_get_user_sessions_v2()
RETURNS TABLE (
  session_id UUID,
  flow_id TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  current_node_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.session_id,
    s.flow_id,
    s.status,
    s.created_at,
    (s.metadata->>'current_node_id')::TEXT AS current_node_id
  FROM chat_sessions_v2 s
  WHERE s.customer_id = auth.uid()
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE chat_flows_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages_v2 ENABLE ROW LEVEL SECURITY;

-- Policies for chat_flows_v2
CREATE POLICY "Anyone can read active flows"
  ON chat_flows_v2 FOR SELECT
  USING (active = true);

-- Policies for chat_sessions_v2
CREATE POLICY "Users can read own sessions"
  ON chat_sessions_v2 FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Users can create own sessions"
  ON chat_sessions_v2 FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON chat_sessions_v2 FOR UPDATE
  USING (customer_id = auth.uid());

-- Policies for chat_messages_v2
CREATE POLICY "Users can read own messages"
  ON chat_messages_v2 FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions_v2
      WHERE chat_sessions_v2.session_id = chat_messages_v2.session_id
        AND chat_sessions_v2.customer_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to own sessions"
  ON chat_messages_v2 FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions_v2
      WHERE chat_sessions_v2.session_id = chat_messages_v2.session_id
        AND chat_sessions_v2.customer_id = auth.uid()
    )
  );

-- ============================================================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_chat_flows_v2
BEFORE UPDATE ON chat_flows_v2
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Allow authenticated users to execute RPC functions
GRANT EXECUTE ON FUNCTION api_insert_chat_message_v2(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION api_fetch_chat_messages_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION api_get_flow_definition(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION api_get_user_sessions_v2() TO authenticated;

-- Grant table permissions
GRANT SELECT ON chat_flows_v2 TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_sessions_v2 TO authenticated;
GRANT SELECT, INSERT ON chat_messages_v2 TO authenticated;

-- ============================================================================
-- Initial Flow Data (Optional - for testing)
-- ============================================================================

-- You can insert flow definitions here or use separate migration files
-- Example:
-- INSERT INTO chat_flows_v2 (flow_id, flow_definition, active)
-- VALUES ('ask-quote', '{"flow_id": "ask-quote", ...}'::jsonb, true);

