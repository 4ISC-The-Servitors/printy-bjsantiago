-- Link chat sessions to quote conversations
-- This migration adds support for linking chat sessions to quote conversations
-- Updated to work with quote_id instead of inquiry_id

-- Add metadata column to chat_sessions table
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add helper function to create quote chat session
CREATE OR REPLACE FUNCTION create_quote_chat_session(
  p_customer_id UUID,
  p_quote_conversation_id UUID,
  p_flow_id TEXT
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO chat_sessions (
    customer_id,
    status,
    metadata
  ) VALUES (
    p_customer_id,
    'active',
    jsonb_build_object('quote_conversation_id', p_quote_conversation_id)
  ) RETURNING session_id INTO v_session_id;
  
  INSERT INTO chat_session_flow (session_id, flow_id)
  VALUES (v_session_id, p_flow_id);
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helper function to get quote conversation from chat session
CREATE OR REPLACE FUNCTION get_quote_conversation_from_session(p_session_id UUID)
RETURNS UUID AS $$
DECLARE
  v_quote_conversation_id UUID;
BEGIN
  SELECT metadata->>'quote_conversation_id'::UUID
  INTO v_quote_conversation_id
  FROM chat_sessions
  WHERE session_id = p_session_id;
  
  RETURN v_quote_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helper function to get all messages for a quote conversation (including from chat sessions)
CREATE OR REPLACE FUNCTION get_all_quote_messages(p_conversation_id UUID)
RETURNS TABLE (
  message_id UUID,
  sender_id UUID,
  sender_role TEXT,
  message_text TEXT,
  message_type TEXT,
  metadata JSONB,
  sent_at TIMESTAMPTZ,
  source TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Messages from quote_messages table
  SELECT 
    qm.message_id,
    qm.sender_id,
    qm.sender_role,
    qm.message_text,
    qm.message_type,
    qm.metadata,
    qm.sent_at,
    'quote_messages'::TEXT as source
  FROM quote_messages qm
  WHERE qm.conversation_id = p_conversation_id
  
  UNION ALL
  
  -- Messages from chat_sessions (if any are linked) - note: chat messages are encrypted
  SELECT 
    cm.message_id,
    cs.customer_id as sender_id,
    COALESCE(cmm.sender_role, 'customer'::TEXT) as sender_role,
    '[Encrypted Chat Message]'::TEXT as message_text, -- Chat messages are encrypted
    'chat'::TEXT as message_type,
    '{}'::JSONB as metadata,
    cm.sent_at,
    'chat_messages'::TEXT as source
  FROM chat_messages cm
  INNER JOIN chat_sessions cs ON cs.session_id = cm.session_id
  LEFT JOIN chat_message_meta cmm ON cm.message_id = cmm.message_id
  WHERE cs.metadata->>'quote_conversation_id' = p_conversation_id::TEXT
  
  ORDER BY sent_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_quote_conversation 
ON chat_sessions USING BTREE ((metadata->>'quote_conversation_id'));

-- Add comments
COMMENT ON FUNCTION create_quote_chat_session IS 'Creates a chat session linked to a quote conversation';
COMMENT ON FUNCTION get_quote_conversation_from_session IS 'Gets the quote conversation ID from a chat session';
COMMENT ON FUNCTION get_all_quote_messages IS 'Gets all messages for a quote conversation from both quote_messages and chat_messages tables';