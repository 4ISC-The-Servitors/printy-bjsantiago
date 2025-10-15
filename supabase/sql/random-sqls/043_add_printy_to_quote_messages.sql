-- Migration 043: Add 'printy' sender role to quote_messages
-- This allows quote conversations to track all bot messages for complete backread capability

-- Update quote_messages sender_role constraint to include 'printy'
ALTER TABLE quote_messages
  DROP CONSTRAINT IF EXISTS quote_messages_sender_role_check;

ALTER TABLE quote_messages
  ADD CONSTRAINT quote_messages_sender_role_check
  CHECK (sender_role IN ('customer', 'admin', 'printy', 'ai'));

-- Update get_all_quote_messages function to properly handle printy messages
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
  -- Messages from quote_messages table (includes customer, admin, printy, ai)
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
  ORDER BY qm.sent_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

