-- Migration: Update api_get_user_sessions_v2 to include display_title
-- Purpose: Fix issue where session titles show flow_id after browser refresh
-- Date: 2025-10-21
-- Related to: Phase 3 of Session Title Consistency Fix

-- Drop the old function
DROP FUNCTION IF EXISTS public.api_get_user_sessions_v2();

-- Recreate with display_title and metadata included
CREATE OR REPLACE FUNCTION public.api_get_user_sessions_v2()
RETURNS TABLE (
  session_id uuid,
  flow_id text,
  status text,
  created_at timestamptz,
  current_node_id text,
  display_title text,
  metadata jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    s.session_id,
    s.flow_id,
    s.status,
    s.created_at,
    (s.metadata->>'current_node_id')::text as current_node_id,
    s.display_title,
    s.metadata
  FROM public.chat_sessions_v2 s
  WHERE s.customer_id = auth.uid()
  ORDER BY s.created_at DESC;
$$;

-- Add comment
COMMENT ON FUNCTION public.api_get_user_sessions_v2() IS
  'Returns all chat sessions for the authenticated user with optimized display_title column';
