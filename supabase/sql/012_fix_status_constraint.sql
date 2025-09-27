-- Force replace the status CHECK constraint on chat_sessions to allow
-- values: active | ended | archived | deleted

-- 1) Backfill any legacy values to be compliant with the new set
UPDATE public.chat_sessions SET status = 'ended' WHERE status = 'resolved';

-- 2) Drop known constraint names if they exist
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chatbot_status_check;
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_status_check;

-- 3) Drop any remaining CHECK constraint that matches a status ANY pattern
DO $$
DECLARE
  cname text;
BEGIN
  SELECT c.conname INTO cname
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'chat_sessions' AND c.contype = 'c' AND pg_get_constraintdef(c.oid) ILIKE '%status = ANY%'
  LIMIT 1;

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.chat_sessions DROP CONSTRAINT %I', cname);
  END IF;
END $$;

-- 4) Create the new CHECK constraint
ALTER TABLE public.chat_sessions
  ADD CONSTRAINT chat_sessions_status_check
  CHECK (status = ANY (ARRAY['active'::text, 'ended'::text, 'archived'::text, 'deleted'::text]));


