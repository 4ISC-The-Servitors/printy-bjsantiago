-- Migration 032: Fix auth table access issues
-- This migration addresses permission denied errors for auth.users table

-- 1. Grant necessary permissions on auth schema for authenticated users
GRANT USAGE ON SCHEMA auth TO authenticated;

-- 2. Grant select permission on auth.users for authenticated users (for profile lookups)
GRANT SELECT ON auth.users TO authenticated;

-- 3. Create a policy to allow users to view their own auth record
CREATE POLICY IF NOT EXISTS "Users can view own auth record" ON auth.users
    FOR SELECT USING (auth.uid() = id);

-- 4. Ensure the customer table has proper RLS
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;

-- 5. Create a simple policy for customer table that allows users to see their own record
-- and admins to see all records
CREATE OR REPLACE FUNCTION user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM customer 
    WHERE customer_id = auth.uid() 
    AND customer_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing customer policies if they exist
DROP POLICY IF EXISTS "Users can view own customer record" ON customer;
DROP POLICY IF EXISTS "Admins can view all customer records" ON customer;
DROP POLICY IF EXISTS "Users can view own or all if admin" ON customer;

-- Create new customer policy
CREATE POLICY "Users can view own or all if admin customer" ON customer
    FOR SELECT USING (
      auth.uid() = customer_id 
      OR user_is_admin()
    );

-- Grant execute permission
GRANT EXECUTE ON FUNCTION user_is_admin() TO authenticated;

-- 6. Add comment
COMMENT ON FUNCTION user_is_admin() IS 'Check if current user is admin for customer table access';

