-- Migration: Add display_title generated column for chat sessions
-- Purpose: Optimize session title queries by avoiding JSONB parsing on every request
-- Date: 2025-10-21
-- Phase 3 of Session Title Consistency Fix

-- ============================================================================
-- 1. Add generated column for display title
-- ============================================================================

-- Add display_title as a STORED generated column
-- This column automatically updates whenever metadata changes
ALTER TABLE chat_sessions_v2
ADD COLUMN display_title TEXT
GENERATED ALWAYS AS (
  COALESCE(
    metadata->>'title',
    flow_id,
    'Chat'
  )
) STORED;

-- Add comment for documentation
COMMENT ON COLUMN chat_sessions_v2.display_title IS
  'Auto-generated display title from metadata->title, falls back to flow_id or "Chat".
   Generated column for performance optimization (Phase 3).';

-- ============================================================================
-- 2. Add indexes for performance
-- ============================================================================

-- Index for sorting/filtering by title
CREATE INDEX IF NOT EXISTS idx_chat_sessions_display_title
ON chat_sessions_v2(display_title);

-- Composite index for customer dashboard queries (customer_id + created_at)
-- This enables fast retrieval of recent sessions for a specific customer
CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer_created
ON chat_sessions_v2(customer_id, created_at DESC);

-- Index for admin queries filtering by admin_chat metadata
-- This uses a GIN index on the metadata JSONB column for efficient filtering
CREATE INDEX IF NOT EXISTS idx_chat_sessions_admin_chat
ON chat_sessions_v2 USING GIN ((metadata->'admin_chat'));

-- ============================================================================
-- 3. Add comments for index documentation
-- ============================================================================

COMMENT ON INDEX idx_chat_sessions_display_title IS
  'Enables fast sorting and filtering by display title';

COMMENT ON INDEX idx_chat_sessions_customer_created IS
  'Optimizes customer dashboard and chat history queries (ordered by created_at DESC)';

COMMENT ON INDEX idx_chat_sessions_admin_chat IS
  'Enables fast filtering of admin-initiated chat sessions';

-- ============================================================================
-- 4. Verify the migration
-- ============================================================================

-- You can verify the generated column works by running:
-- SELECT session_id, flow_id, metadata->>'title' as meta_title, display_title
-- FROM chat_sessions_v2 LIMIT 10;

-- You can verify index usage with:
-- EXPLAIN ANALYZE
-- SELECT session_id, flow_id, display_title, created_at, status
-- FROM chat_sessions_v2
-- WHERE customer_id = '<some_uuid>'
-- ORDER BY created_at DESC
-- LIMIT 10;
