-- Migration: Phase 1 - Add indexes for quote metadata on chat_sessions_v2
-- Purpose: Enable efficient querying of quote sessions by display_id and status

-- Add GIN index on metadata for flexible JSON queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_v2_metadata_gin 
ON chat_sessions_v2 USING gin(metadata);

-- Add B-tree index on quote display_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_v2_quote_display_id 
ON chat_sessions_v2 ((metadata->'quote'->>'display_id'));

-- Add B-tree index on quote status for filtering
CREATE INDEX IF NOT EXISTS idx_chat_sessions_v2_quote_status 
ON chat_sessions_v2 ((metadata->'quote'->>'status'));

-- Add index on flow_id for quote sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_v2_flow_id 
ON chat_sessions_v2 (flow_id) WHERE flow_id = 'ask-quote';

COMMENT ON INDEX idx_chat_sessions_v2_metadata_gin IS 'GIN index for flexible JSONB queries on session metadata';
COMMENT ON INDEX idx_chat_sessions_v2_quote_display_id IS 'Fast lookup for quote sessions by display_id (e.g., QOT-300001)';
COMMENT ON INDEX idx_chat_sessions_v2_quote_status IS 'Filter quote sessions by status (active, spec_proposed, accepted, etc.)';

