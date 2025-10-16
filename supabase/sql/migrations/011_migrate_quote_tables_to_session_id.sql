-- Migrate quote_specs and quote_proposals to use session_id (chat_sessions_v2)
-- Deprecate conversation_id columns and foreign keys

-- ===============================
-- quote_specs
-- ===============================
ALTER TABLE IF EXISTS public.quote_specs
  ADD COLUMN IF NOT EXISTS session_id uuid;

-- Backfill session_id from legacy conversation_id when present (if the column still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_specs' AND column_name = 'conversation_id'
  ) THEN
    UPDATE public.quote_specs
    SET session_id = conversation_id
    WHERE session_id IS NULL AND conversation_id IS NOT NULL;
  END IF;
END $$;

-- Add FK and indexes for session_id
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.quote_specs
      ADD CONSTRAINT quote_specs_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES public.chat_sessions_v2(session_id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN
    -- constraint already exists
    NULL;
  END;
END $$;

CREATE INDEX IF NOT EXISTS idx_quote_specs_session_id ON public.quote_specs USING btree (session_id);

-- Drop old FK and column if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'quote_specs_conversation_id_fkey'
  ) THEN
    ALTER TABLE public.quote_specs DROP CONSTRAINT quote_specs_conversation_id_fkey;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_specs' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE public.quote_specs DROP COLUMN conversation_id;
  END IF;
END $$;

-- ===============================
-- quote_proposals
-- ===============================
ALTER TABLE IF EXISTS public.quote_proposals
  ADD COLUMN IF NOT EXISTS session_id uuid;

-- Backfill session_id from legacy conversation_id when present (if the column still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_proposals' AND column_name = 'conversation_id'
  ) THEN
    UPDATE public.quote_proposals
    SET session_id = conversation_id
    WHERE session_id IS NULL AND conversation_id IS NOT NULL;
  END IF;
END $$;

-- Add FK and index for session_id
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.quote_proposals
      ADD CONSTRAINT quote_proposals_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES public.chat_sessions_v2(session_id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

CREATE INDEX IF NOT EXISTS idx_quote_proposals_session_id ON public.quote_proposals USING btree (session_id);

-- Drop old FK and column if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'quote_proposals_conversation_id_fkey'
  ) THEN
    ALTER TABLE public.quote_proposals DROP CONSTRAINT quote_proposals_conversation_id_fkey;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_proposals' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE public.quote_proposals DROP COLUMN conversation_id;
  END IF;
END $$;

-- Notes:
-- - Triggers remain intact (update_updated_at_column)
-- - Down migration not provided; retain a backup before applying in production


