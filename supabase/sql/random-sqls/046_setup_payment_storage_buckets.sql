-- Migration 046: Setup payment storage buckets with proper security

-- 1. Create payment-methods bucket (PUBLIC - customers need to see these)
-- Note: This needs to be done manually in Supabase Dashboard as SQL can't create storage buckets
-- Bucket name: payment-methods
-- Public: true
-- Purpose: Store admin-uploaded bank details and QR codes that customers need to see

-- 2. Create payment-proofs bucket (PRIVATE - sensitive customer data)
-- Note: This needs to be done manually in Supabase Dashboard as SQL can't create storage buckets  
-- Bucket name: payment-proofs
-- Public: false
-- Purpose: Store customer-uploaded payment proof images (sensitive financial data)

-- 3. Create storage policies for payment-proofs bucket (PRIVATE)
CREATE POLICY "Authenticated users can upload payment proofs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-proofs' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can upload to own payment-proofs folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own payment proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all payment proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs'
    AND auth.jwt() ->> 'role' = 'admin'
  );

-- 4. Create storage policies for payment-methods bucket (PUBLIC)
CREATE POLICY "Public can view payment method images" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-methods');

CREATE POLICY "Admins can manage payment method images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'payment-methods'
    AND auth.jwt() ->> 'role' = 'admin'
  );

-- Manual steps required:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Create bucket "payment-methods" (PUBLIC)
-- 3. Create bucket "payment-proofs" (PRIVATE) 
-- 4. The RLS policies above will be automatically created
-- 5. Upload your bank details and QR codes to payment-methods bucket
-- 6. Customer payment proofs will be automatically uploaded to payment-proofs bucket
