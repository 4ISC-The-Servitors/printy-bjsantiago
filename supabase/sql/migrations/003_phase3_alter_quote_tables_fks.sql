-- Migration: Phase 3 - Alter quote tables to reference chat_sessions_v2 and chat_messages_v2
-- Purpose: Update foreign keys so quote_specs, quote_proposals, quote_orders point to the unified chat tables

-- IMPORTANT: Run this migration AFTER you have migrated existing data (Phase 4)
-- This script adds new columns, then you'll backfill data, then drop old columns

-- ============================================================================
-- Step 1: Add new columns to quote_specs
-- ============================================================================
ALTER TABLE quote_specs 
ADD COLUMN IF NOT EXISTS session_id uuid;

ALTER TABLE quote_specs 
ADD COLUMN IF NOT EXISTS trigger_message_id_v2 uuid;

COMMENT ON COLUMN quote_specs.session_id IS 'References chat_sessions_v2.session_id (replaces conversation_id)';
COMMENT ON COLUMN quote_specs.trigger_message_id_v2 IS 'References chat_messages_v2.message_id (replaces trigger_message_id)';

-- ============================================================================
-- Step 2: Add new columns to quote_proposals
-- ============================================================================
ALTER TABLE quote_proposals 
ADD COLUMN IF NOT EXISTS session_id uuid;

COMMENT ON COLUMN quote_proposals.session_id IS 'References chat_sessions_v2.session_id (replaces conversation_id)';

-- ============================================================================
-- Step 3: Add new columns to quote_orders
-- ============================================================================
ALTER TABLE quote_orders 
ADD COLUMN IF NOT EXISTS session_id uuid;

COMMENT ON COLUMN quote_orders.session_id IS 'References chat_sessions_v2.session_id (replaces conversation_id)';

-- ============================================================================
-- Step 4: Add foreign key constraints (after backfill in Phase 4)
-- ============================================================================
-- NOTE: Uncomment these after running the data migration (004_phase4_data_migration.sql)

-- ALTER TABLE quote_specs
-- ADD CONSTRAINT quote_specs_session_id_fkey 
-- FOREIGN KEY (session_id) REFERENCES chat_sessions_v2(session_id) ON DELETE CASCADE;

-- ALTER TABLE quote_specs
-- ADD CONSTRAINT quote_specs_trigger_message_id_v2_fkey 
-- FOREIGN KEY (trigger_message_id_v2) REFERENCES chat_messages_v2(message_id) ON DELETE SET NULL;

-- ALTER TABLE quote_proposals
-- ADD CONSTRAINT quote_proposals_session_id_fkey 
-- FOREIGN KEY (session_id) REFERENCES chat_sessions_v2(session_id) ON DELETE CASCADE;

-- ALTER TABLE quote_orders
-- ADD CONSTRAINT quote_orders_session_id_fkey 
-- FOREIGN KEY (session_id) REFERENCES chat_sessions_v2(session_id) ON DELETE CASCADE;

-- ============================================================================
-- Step 5: Create indexes on new columns
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_quote_specs_session_id ON quote_specs(session_id);
CREATE INDEX IF NOT EXISTS idx_quote_proposals_session_id ON quote_proposals(session_id);
CREATE INDEX IF NOT EXISTS idx_quote_orders_session_id ON quote_orders(session_id);

COMMENT ON INDEX idx_quote_specs_session_id IS 'Index for quote_specs lookups by session_id';
COMMENT ON INDEX idx_quote_proposals_session_id IS 'Index for quote_proposals lookups by session_id';
COMMENT ON INDEX idx_quote_orders_session_id IS 'Index for quote_orders lookups by session_id';

