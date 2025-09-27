-- Update chat_sessions.status enum-like CHECK to: active | ended | archived | deleted

-- Backfill existing values before tightening the constraint
UPDATE public.chat_sessions SET status = 'ended' WHERE status = 'resolved';

-- Drop existing CHECK constraint if present (common generated name)
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_status_check;

-- Some setups may have a different constraint name; try dropping by filtering pg_constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'chat_sessions' AND c.contype = 'c' AND c.conname <> 'chat_sessions_status_check'
      AND pg_get_constraintdef(c.oid) ILIKE '%status = ANY%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.chat_sessions DROP CONSTRAINT ' || quote_ident(c.conname)
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = 'chat_sessions' AND c.contype = 'c' AND pg_get_constraintdef(c.oid) ILIKE '%status = ANY%'
      LIMIT 1
    );
  END IF;
END $$;

-- Add the new CHECK constraint
ALTER TABLE public.chat_sessions
  ADD CONSTRAINT chat_sessions_status_check
  CHECK (status = ANY (ARRAY['active'::text, 'ended'::text, 'archived'::text, 'deleted'::text]));


