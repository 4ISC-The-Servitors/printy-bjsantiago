-- Migration: Phase 5 - Enable foreign keys and begin cleanup
-- Purpose: Add FK constraints and prepare for deprecation of old tables

-- IMPORTANT: Only run this AFTER verifying Phase 4 data migration is complete and correct

-- ============================================================================
-- Step 1: Add foreign key constraints to quote tables
-- ============================================================================

-- Add FK from quote_specs to chat_sessions_v2
ALTER TABLE quote_specs
ADD CONSTRAINT quote_specs_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES chat_sessions_v2(session_id) ON DELETE CASCADE;

-- Add FK from quote_specs to chat_messages_v2
ALTER TABLE quote_specs
ADD CONSTRAINT quote_specs_trigger_message_id_v2_fkey 
FOREIGN KEY (trigger_message_id_v2) REFERENCES chat_messages_v2(message_id) ON DELETE SET NULL;

-- Add FK from quote_proposals to chat_sessions_v2
ALTER TABLE quote_proposals
ADD CONSTRAINT quote_proposals_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES chat_sessions_v2(session_id) ON DELETE CASCADE;

-- Add FK from quote_orders to chat_sessions_v2
ALTER TABLE quote_orders
ADD CONSTRAINT quote_orders_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES chat_sessions_v2(session_id) ON DELETE CASCADE;

-- ============================================================================
-- Step 2: Drop old foreign keys from quote tables
-- ============================================================================

-- Drop old FKs from quote_specs
ALTER TABLE quote_specs DROP CONSTRAINT IF EXISTS quote_specs_conversation_id_fkey;
ALTER TABLE quote_specs DROP CONSTRAINT IF EXISTS quote_specs_trigger_message_id_fkey;

-- Drop old FKs from quote_proposals
ALTER TABLE quote_proposals DROP CONSTRAINT IF EXISTS quote_proposals_conversation_id_fkey;

-- Drop old FKs from quote_orders
ALTER TABLE quote_orders DROP CONSTRAINT IF EXISTS quote_orders_conversation_id_fkey;

-- ============================================================================
-- Step 3: Make new columns NOT NULL (after verification)
-- ============================================================================

-- Verify all rows have session_id before making NOT NULL
DO $$
DECLARE
  v_null_specs INT;
  v_null_proposals INT;
  v_null_orders INT;
BEGIN
  SELECT COUNT(*) INTO v_null_specs FROM quote_specs WHERE session_id IS NULL;
  SELECT COUNT(*) INTO v_null_proposals FROM quote_proposals WHERE session_id IS NULL;
  SELECT COUNT(*) INTO v_null_orders FROM quote_orders WHERE session_id IS NULL;
  
  IF v_null_specs > 0 OR v_null_proposals > 0 OR v_null_orders > 0 THEN
    RAISE EXCEPTION 'Cannot make session_id NOT NULL: % specs, % proposals, % orders have NULL session_id', 
      v_null_specs, v_null_proposals, v_null_orders;
  END IF;
END $$;

-- Make session_id NOT NULL
ALTER TABLE quote_specs ALTER COLUMN session_id SET NOT NULL;
ALTER TABLE quote_proposals ALTER COLUMN session_id SET NOT NULL;
ALTER TABLE quote_orders ALTER COLUMN session_id SET NOT NULL;

-- ============================================================================
-- Step 4: Drop old columns (CAREFUL - this is destructive!)
-- ============================================================================

-- UNCOMMENT THESE AFTER VERIFYING EVERYTHING WORKS
-- ALTER TABLE quote_specs DROP COLUMN IF EXISTS conversation_id;
-- ALTER TABLE quote_specs DROP COLUMN IF EXISTS trigger_message_id;
-- ALTER TABLE quote_proposals DROP COLUMN IF EXISTS conversation_id;
-- ALTER TABLE quote_orders DROP COLUMN IF EXISTS conversation_id;

-- ============================================================================
-- Step 5: Rename new columns to replace old ones
-- ============================================================================

-- UNCOMMENT THESE AFTER dropping old columns
-- ALTER TABLE quote_specs RENAME COLUMN trigger_message_id_v2 TO trigger_message_id;

-- ============================================================================
-- Step 6: Create compatibility view (optional, for gradual transition)
-- ============================================================================

CREATE OR REPLACE VIEW quote_conversations_compat AS
SELECT
  (metadata->'quote'->>'quote_id')::uuid AS quote_id,
  session_id AS conversation_id,
  customer_id,
  (metadata->'quote'->>'status')::text AS status,
  created_at,
  (metadata->'quote'->>'updated_at')::timestamptz AS updated_at,
  ended_at,
  (metadata->'quote'->>'display_id')::text AS display_id
FROM chat_sessions_v2
WHERE flow_id = 'ask-quote';

COMMENT ON VIEW quote_conversations_compat IS 'Compatibility view mapping chat_sessions_v2 to old quote_conversations structure';

-- ============================================================================
-- Step 7: Update RLS policies if needed
-- ============================================================================

-- Ensure chat_sessions_v2 policies allow quote access
-- (Add specific policies based on your security requirements)

-- Example: Allow customers to read their own quote sessions
-- CREATE POLICY "Customers can read own quote sessions"
-- ON chat_sessions_v2 FOR SELECT
-- USING (auth.uid() = customer_id AND flow_id = 'ask-quote');

-- Example: Allow admins to read all quote sessions
-- CREATE POLICY "Admins can read all quote sessions"
-- ON chat_sessions_v2 FOR SELECT
-- USING (EXISTS (
--   SELECT 1 FROM customer 
--   WHERE customer_id = auth.uid() 
--   AND customer_type = 'admin'
-- ));

