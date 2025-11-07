-- Migration: Create RLS policies for ticket-uploads storage bucket
-- Allows customers to upload/view their own ticket images and images in their tickets
-- Allows admins to upload/view all ticket images

-- Ensure the bucket exists (it should already exist, but this is safe)
-- Note: Bucket creation must be done manually in Supabase dashboard if it doesn't exist

-- Customer Upload Policy: Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "Customers can upload ticket images to their folder" ON storage.objects;
CREATE POLICY "Customers can upload ticket images to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Customer Read Policy: Allow authenticated users to view their own uploads and uploads in their tickets
DROP POLICY IF EXISTS "Customers can view ticket images in their sessions" ON storage.objects;
CREATE POLICY "Customers can view ticket images in their sessions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-uploads' AND (
    -- Own uploads
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Uploads in tickets they're part of (check if inquiry_id in path matches their inquiries)
    (storage.foldername(name))[2] IN (
      SELECT inquiry_id::text 
      FROM inquiries_v2 
      WHERE customer_id = auth.uid()
    )
  )
);

-- Admin Read Policy: Allow admins to view all ticket uploads
DROP POLICY IF EXISTS "Admins can view all ticket images" ON storage.objects;
CREATE POLICY "Admins can view all ticket images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-uploads' AND
  EXISTS (
    SELECT 1 
    FROM customer 
    WHERE customer_id = auth.uid() 
      AND customer_type = 'admin'
  )
);

-- Admin Upload Policy: Allow admins to upload to any customer's ticket folder
DROP POLICY IF EXISTS "Admins can upload ticket images to any ticket" ON storage.objects;
CREATE POLICY "Admins can upload ticket images to any ticket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-uploads' AND
  EXISTS (
    SELECT 1 
    FROM customer 
    WHERE customer_id = auth.uid() 
      AND customer_type = 'admin'
  )
);

