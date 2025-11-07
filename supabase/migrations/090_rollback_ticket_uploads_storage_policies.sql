-- Rollback Migration: Remove RLS policies for ticket-uploads storage bucket
-- Use this to remove the policies if migration 090 causes issues
--
-- To apply: Run this file after migration 090 to remove all ticket-upload policies
-- This will drop all four policies created in migration 090

-- Remove Customer Upload Policy
DROP POLICY IF EXISTS "Customers can upload ticket images to their folder" ON storage.objects;

-- Remove Customer Read Policy
DROP POLICY IF EXISTS "Customers can view ticket images in their sessions" ON storage.objects;

-- Remove Admin Read Policy
DROP POLICY IF EXISTS "Admins can view all ticket images" ON storage.objects;

-- Remove Admin Upload Policy
DROP POLICY IF EXISTS "Admins can upload ticket images to any ticket" ON storage.objects;

-- Verify policies are removed
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname IN (
      'Customers can upload ticket images to their folder',
      'Customers can view ticket images in their sessions',
      'Admins can view all ticket images',
      'Admins can upload ticket images to any ticket'
    );

  IF policy_count > 0 THEN
    RAISE WARNING 'Some ticket-upload policies still exist. Policy count: %', policy_count;
  END IF;
END $$;

