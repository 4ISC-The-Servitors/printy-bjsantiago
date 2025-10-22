-- Migration: Update chat_sessions_v2 foreign key to point to inquiries_v2
-- Purpose: Fix FK constraint that was pointing to old inquiries table
-- Note: This migration handles existing data by setting inquiry_id to NULL for old sessions

-- 1. Drop the old foreign key constraint
ALTER TABLE public.chat_sessions_v2 
  DROP CONSTRAINT IF EXISTS chat_sessions_v2_inquiry_id_fkey;

-- 2. Set existing inquiry_id values to NULL (they point to old inquiries table)
-- This prevents FK constraint violations for existing sessions
UPDATE public.chat_sessions_v2 
SET inquiry_id = NULL 
WHERE inquiry_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.inquiries_v2 
    WHERE inquiries_v2.inquiry_id = chat_sessions_v2.inquiry_id
  );

-- 3. Create new foreign key constraint pointing to inquiries_v2
ALTER TABLE public.chat_sessions_v2 
  ADD CONSTRAINT chat_sessions_v2_inquiry_id_fkey 
  FOREIGN KEY (inquiry_id) 
  REFERENCES inquiries_v2 (inquiry_id) 
  ON DELETE SET NULL;

-- 4. Add comment for documentation
COMMENT ON CONSTRAINT chat_sessions_v2_inquiry_id_fkey ON public.chat_sessions_v2 
  IS 'Links chat sessions to support tickets in inquiries_v2 table (migrated from old inquiries table)';

