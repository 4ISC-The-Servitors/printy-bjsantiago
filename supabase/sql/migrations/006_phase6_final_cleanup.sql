-- Migration: Phase 6 - Final cleanup (DESTRUCTIVE)
-- Purpose: Drop deprecated tables and complete migration

-- ⚠️ WARNING: This migration is DESTRUCTIVE and IRREVERSIBLE
-- Only run this after:
-- 1. All applications are updated to use chat_sessions_v2 / chat_messages_v2
-- 2. Thorough testing in production for at least 1-2 weeks
-- 3. Database backup is confirmed and verified

-- ============================================================================
-- Step 1: Drop old RPC functions that directly referenced old tables
-- ============================================================================

-- Drop compatibility functions if they exist
DROP FUNCTION IF EXISTS get_all_quote_messages(uuid);
DROP FUNCTION IF EXISTS get_conversation_messages(uuid);
DROP FUNCTION IF EXISTS create_quote_chat_session(uuid);

-- ============================================================================
-- Step 2: Drop compatibility view
-- ============================================================================

DROP VIEW IF EXISTS quote_conversations_compat;

-- ============================================================================
-- Step 3: Drop migration mapping table
-- ============================================================================

DROP TABLE IF EXISTS quote_migration_map;

-- ============================================================================
-- Step 4: Drop old tables (THE POINT OF NO RETURN)
-- ============================================================================

-- UNCOMMENT THESE ONLY WHEN YOU ARE ABSOLUTELY SURE
-- DROP TABLE IF EXISTS quote_messages CASCADE;
-- DROP TABLE IF EXISTS quote_conversations CASCADE;

-- ============================================================================
-- Step 5: Drop the old quote display sequence (if not needed)
-- ============================================================================

-- NOTE: Keep this if you still use it in create_quote_conversation
-- DROP SEQUENCE IF EXISTS quote_display_seq;

-- ============================================================================
-- Step 6: Final verification
-- ============================================================================

DO $$
BEGIN
  -- Verify quote tables still have data
  IF NOT EXISTS (SELECT 1 FROM quote_specs LIMIT 1) THEN
    RAISE WARNING 'quote_specs table is empty - this might be unexpected';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM quote_proposals LIMIT 1) THEN
    RAISE WARNING 'quote_proposals table is empty - this might be unexpected';
  END IF;

  -- Verify chat_sessions_v2 has quote sessions
  IF NOT EXISTS (
    SELECT 1 FROM chat_sessions_v2 WHERE flow_id = 'ask-quote' LIMIT 1
  ) THEN
    RAISE WARNING 'No quote sessions found in chat_sessions_v2';
  END IF;

  RAISE NOTICE '=== Final Cleanup Complete ===';
  RAISE NOTICE 'Migration fully complete. Old tables can now be dropped if desired.';
END $$;

-- ============================================================================
-- Step 7: Document remaining structure
-- ============================================================================

COMMENT ON TABLE chat_sessions_v2 IS 'Unified chat sessions including quotes (flow_id=ask-quote), tickets (flow_id=issue-ticket), and other flows';
COMMENT ON TABLE chat_messages_v2 IS 'Encrypted messages for all chat flows including quotes';
COMMENT ON TABLE quote_specs IS 'AI-generated specification versions for quotes (references chat_sessions_v2.session_id)';
COMMENT ON TABLE quote_proposals IS 'Admin-finalized specs with pricing for quotes (references chat_sessions_v2.session_id)';
COMMENT ON TABLE quote_orders IS 'Links accepted quote proposals to orders (references chat_sessions_v2.session_id)';

