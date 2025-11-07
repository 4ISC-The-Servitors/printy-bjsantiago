-- Migration: Create RLS policies for order-uploads storage bucket
-- Mirrors ticket-uploads policies; allows customers/admins appropriate access

-- Customer Upload Policy: Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "Customers can upload order images to their folder" ON storage.objects;
CREATE POLICY "Customers can upload order images to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Customer Read Policy: Allow authenticated users to view their own uploads and uploads in their orders
DROP POLICY IF EXISTS "Customers can view order images in their orders" ON storage.objects;
CREATE POLICY "Customers can view order images in their orders"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'order-uploads' AND (
    -- Own uploads
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Uploads in orders they're part of (check if order_id in path matches their orders)
    (storage.foldername(name))[2] IN (
      SELECT order_id::text
      FROM public.orders
      WHERE customer_id = auth.uid()
    )
  )
);

-- Admin Read Policy: Allow admins to view all order uploads
DROP POLICY IF EXISTS "Admins can view all order images" ON storage.objects;
CREATE POLICY "Admins can view all order images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'order-uploads' AND
  EXISTS (
    SELECT 1
    FROM public.customer
    WHERE customer_id = auth.uid()
      AND customer_type = 'admin'
  )
);

-- Admin Upload Policy: Allow admins to upload to any customer's order folder
DROP POLICY IF EXISTS "Admins can upload order images to any order" ON storage.objects;
CREATE POLICY "Admins can upload order images to any order"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-uploads' AND
  EXISTS (
    SELECT 1
    FROM public.customer
    WHERE customer_id = auth.uid()
      AND customer_type = 'admin'
  )
);


