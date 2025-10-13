-- Migration 048: Fix admin policy for viewing payment proofs
-- The current policy checks JWT role instead of customer_type in customer table

-- Drop the existing admin policy
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;

-- Create a new admin policy that checks customer_type in customer table
CREATE POLICY "Admins can view all payment proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs'
    AND EXISTS (
      SELECT 1 FROM customer 
      WHERE customer_id = auth.uid() 
      AND customer_type = 'admin'
    )
  );
