-- Migration: Update quote_proposals RLS to use session_id and chat_sessions_v2
-- Purpose: After deprecating quote_conversations and quote_messages in favor of
-- chat_sessions_v2 and chat_messages_v2, update RLS policies on quote_proposals
-- to reference the new schema.

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.quote_proposals ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on quote_proposals
DO $$
BEGIN
  -- Drop legacy policies that referenced quote_conversations
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quote_proposals' AND policyname = 'Users can view quote proposals in their conversations'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view quote proposals in their conversations" ON public.quote_proposals';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quote_proposals' AND policyname = 'Admins can manage quote proposals'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can manage quote proposals" ON public.quote_proposals';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quote_proposals' AND policyname = 'Customers can accept or reject proposals'
  ) THEN
    EXECUTE 'DROP POLICY "Customers can accept or reject proposals" ON public.quote_proposals';
  END IF;

  -- Drop any other existing policies
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quote_proposals' AND policyname = 'select quote_proposals by session'
  ) THEN
    EXECUTE 'DROP POLICY "select quote_proposals by session" ON public.quote_proposals';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quote_proposals' AND policyname = 'insert quote_proposals by admin'
  ) THEN
    EXECUTE 'DROP POLICY "insert quote_proposals by admin" ON public.quote_proposals';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quote_proposals' AND policyname = 'update quote_proposals'
  ) THEN
    EXECUTE 'DROP POLICY "update quote_proposals" ON public.quote_proposals';
  END IF;
END $$;

-- ============================================================================
-- SELECT Policy: Admins see all, customers see their own proposals
-- ============================================================================
CREATE POLICY "select quote_proposals by session"
  ON public.quote_proposals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions_v2 cs
      WHERE cs.session_id = quote_proposals.session_id
        AND (is_admin() OR cs.customer_id = auth.uid())
    )
  );

-- ============================================================================
-- INSERT Policy: Only admins can create proposals
-- ============================================================================
CREATE POLICY "insert quote_proposals by admin"
  ON public.quote_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions_v2 cs
      WHERE cs.session_id = quote_proposals.session_id
        AND is_admin()
    )
  );

-- ============================================================================
-- UPDATE Policy: Admins can update all fields, customers can only accept/reject
-- ============================================================================
CREATE POLICY "update quote_proposals"
  ON public.quote_proposals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions_v2 cs
      WHERE cs.session_id = quote_proposals.session_id
        AND (
          -- Admins can update everything
          is_admin()
          OR
          -- Customers can only update their own proposals
          (cs.customer_id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions_v2 cs
      WHERE cs.session_id = quote_proposals.session_id
        AND (
          -- Admins can update to any status
          is_admin()
          OR
          -- Customers can only update status to accepted/rejected
          (
            cs.customer_id = auth.uid()
            AND quote_proposals.status IN ('accepted', 'rejected')
          )
        )
    )
  );

-- ============================================================================
-- Ensure privileges are in place
-- ============================================================================
GRANT SELECT, INSERT, UPDATE ON public.quote_proposals TO authenticated;

-- ============================================================================
-- Add helpful comments
-- ============================================================================
COMMENT ON POLICY "select quote_proposals by session" ON public.quote_proposals IS 
  'Allows admins to view all proposals and customers to view their own proposals via chat_sessions_v2';

COMMENT ON POLICY "insert quote_proposals by admin" ON public.quote_proposals IS 
  'Only admins can create new proposals';

COMMENT ON POLICY "update quote_proposals" ON public.quote_proposals IS 
  'Admins can update all fields; customers can only update status to accepted/rejected for their own proposals';

