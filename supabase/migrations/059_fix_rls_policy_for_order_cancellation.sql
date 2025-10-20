-- Fix RLS policy to allow customers to cancel orders from reupload_payment status
-- This fixes the "new row violates row-level security policy" error when customers try to cancel orders

-- Drop the existing policy
DROP POLICY IF EXISTS "Customers can update own order payment fields" ON orders;

-- Create updated policy that allows customers to update their own orders
-- for the specified statuses: awaiting_payment, verifying_payment, reupload_payment, reupload_payment_proof, and cancelled
CREATE POLICY "Customers can update own order payment fields" ON orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = customer_id
  AND status = ANY (ARRAY[
    'awaiting_payment'::text,
    'verifying_payment'::text,
    'reupload_payment'::text,
    'reupload_payment_proof'::text,
    'cancelled'::text
  ])
)
WITH CHECK (
  auth.uid() = customer_id
  AND status = ANY (ARRAY[
    'awaiting_payment'::text,
    'verifying_payment'::text,
    'reupload_payment'::text,
    'reupload_payment_proof'::text,
    'cancelled'::text
  ])
);