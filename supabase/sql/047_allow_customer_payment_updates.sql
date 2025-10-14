-- Migration 047: Allow customers to update payment-related fields on their own orders
-- This enables customers to upload payment proofs and update order status

-- Drop existing policy if it exists and recreate with proper status restrictions
DROP POLICY IF EXISTS "Customers can update own order payment fields" ON orders_duplicate;

-- Add a new RLS policy for customers to update payment-related fields
CREATE POLICY "Customers can update own order payment fields" ON orders_duplicate
  FOR UPDATE USING (
    auth.uid() = customer_id
    AND status IN ('awaiting_payment', 'reupload_payment')
  )
  WITH CHECK (
    auth.uid() = customer_id
    AND status IN ('awaiting_payment', 'verifying_payment', 'reupload_payment')
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Customers can update own order payment fields" ON orders_duplicate IS
'Allows customers to upload payment proofs and update order status to verifying_payment';
