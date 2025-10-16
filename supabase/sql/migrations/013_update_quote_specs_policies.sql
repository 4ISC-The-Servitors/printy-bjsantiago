-- Migration: Update quote_specs RLS to use session_id and allow inserts
-- Purpose: After migrating quote_specs to reference chat_sessions_v2.session_id,
-- some code attempting to insert drafts fails with RLS 42501. This migration
-- refreshes policies to align with the new schema.

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.quote_specs ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies that referenced conversation_id if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quote_specs' AND policyname = 'Users can view quote specs in their conversations'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view quote specs in their conversations" ON public.quote_specs';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quote_specs' AND policyname = 'Admins can insert quote specs'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can insert quote specs" ON public.quote_specs';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quote_specs' AND policyname = 'insert own quote_specs'
  ) THEN
    EXECUTE 'DROP POLICY "insert own quote_specs" ON public.quote_specs';
  END IF;

  -- Drop any prior session-based policies before re-creating
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quote_specs' AND policyname = 'select quote_specs by session'
  ) THEN
    EXECUTE 'DROP POLICY "select quote_specs by session" ON public.quote_specs';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quote_specs' AND policyname = 'insert quote_specs by session'
  ) THEN
    EXECUTE 'DROP POLICY "insert quote_specs by session" ON public.quote_specs';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quote_specs' AND policyname = 'update quote_specs by session'
  ) THEN
    EXECUTE 'DROP POLICY "update quote_specs by session" ON public.quote_specs';
  END IF;
END $$;

-- Read access: any authenticated user can select specs for existing sessions
-- Note: You may further restrict by ownership if your chat_sessions_v2 stores owner ids.
CREATE POLICY "select quote_specs by session"
  ON public.quote_specs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions_v2 cs
      WHERE cs.session_id = quote_specs.session_id
        AND (is_admin() OR cs.customer_id = auth.uid())
    )
  );

-- Insert access: allow inserting a spec when the referenced session exists
CREATE POLICY "insert quote_specs by session"
  ON public.quote_specs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions_v2 cs
      WHERE cs.session_id = quote_specs.session_id
        AND is_admin()
    )
  );

-- Update access: allow updates for rows tied to valid sessions (optional)
CREATE POLICY "update quote_specs by session"
  ON public.quote_specs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions_v2 cs
      WHERE cs.session_id = quote_specs.session_id
        AND is_admin()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions_v2 cs
      WHERE cs.session_id = quote_specs.session_id
        AND is_admin()
    )
  );

-- Ensure privileges are in place
GRANT SELECT, INSERT, UPDATE ON public.quote_specs TO authenticated;


