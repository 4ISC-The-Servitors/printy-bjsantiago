-- Migration 031: Simple fix for admin access issues
-- This migration provides a quick fix for admin access to inquiries_duplicate

-- 1. Create a simple function to check admin status
CREATE OR REPLACE FUNCTION is_admin_user()
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

-- 2. Drop all existing policies on inquiries_duplicate
DROP POLICY IF EXISTS "Regular users can view own inquiries" ON inquiries_duplicate;
DROP POLICY IF EXISTS "Regular users can insert own inquiries" ON inquiries_duplicate;
DROP POLICY IF EXISTS "Regular users can update own inquiries" ON inquiries_duplicate;
DROP POLICY IF EXISTS "Admins can view all inquiries" ON inquiries_duplicate;
DROP POLICY IF EXISTS "Admins can insert inquiries" ON inquiries_duplicate;
DROP POLICY IF EXISTS "Admins can update any inquiry" ON inquiries_duplicate;

-- 3. Create simple policies for inquiries_duplicate
-- Allow users to see their own inquiries OR admins to see all
CREATE POLICY "Users can view own or all if admin" ON inquiries_duplicate
    FOR SELECT USING (
      auth.uid() = customer_id 
      OR is_admin_user()
    );

-- Allow users to insert their own inquiries OR admins to insert any
CREATE POLICY "Users can insert own or any if admin" ON inquiries_duplicate
    FOR INSERT WITH CHECK (
      auth.uid() = customer_id 
      OR is_admin_user()
    );

-- Allow users to update their own inquiries OR admins to update any
CREATE POLICY "Users can update own or any if admin" ON inquiries_duplicate
    FOR UPDATE USING (
      auth.uid() = customer_id 
      OR is_admin_user()
    );

-- 4. Create policies for customer table
-- Allow users to see their own customer record OR admins to see all
CREATE POLICY "Users can view own or all if admin" ON customer
    FOR SELECT USING (
      auth.uid() = customer_id 
      OR is_admin_user()
    );

-- 5. Create policies for orders_duplicate
DROP POLICY IF EXISTS "Regular users can view own orders" ON orders_duplicate;
DROP POLICY IF EXISTS "Regular users can insert own orders" ON orders_duplicate;
DROP POLICY IF EXISTS "Regular users can update own orders" ON orders_duplicate;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders_duplicate;
DROP POLICY IF EXISTS "Admins can insert orders" ON orders_duplicate;
DROP POLICY IF EXISTS "Admins can update any order" ON orders_duplicate;

CREATE POLICY "Users can view own or all if admin orders" ON orders_duplicate
    FOR SELECT USING (
      auth.uid() = customer_id 
      OR is_admin_user()
    );

CREATE POLICY "Users can insert own or any if admin orders" ON orders_duplicate
    FOR INSERT WITH CHECK (
      auth.uid() = customer_id 
      OR is_admin_user()
    );

CREATE POLICY "Users can update own or any if admin orders" ON orders_duplicate
    FOR UPDATE USING (
      auth.uid() = customer_id 
      OR is_admin_user()
    );

-- 6. Create policies for quotes_duplicate
DROP POLICY IF EXISTS "Regular users can view own quotes" ON quotes_duplicate;
DROP POLICY IF EXISTS "Regular users can insert own quotes" ON quotes_duplicate;
DROP POLICY IF EXISTS "Regular users can update own quotes" ON quotes_duplicate;
DROP POLICY IF EXISTS "Admins can view all quotes" ON quotes_duplicate;
DROP POLICY IF EXISTS "Admins can insert quotes" ON quotes_duplicate;
DROP POLICY IF EXISTS "Admins can update any quote" ON quotes_duplicate;

CREATE POLICY "Users can view own or all if admin quotes" ON quotes_duplicate
    FOR SELECT USING (
      auth.uid() = customer_id 
      OR is_admin_user()
    );

CREATE POLICY "Users can insert own or any if admin quotes" ON quotes_duplicate
    FOR INSERT WITH CHECK (
      auth.uid() = customer_id 
      OR is_admin_user()
    );

CREATE POLICY "Users can update own or any if admin quotes" ON quotes_duplicate
    FOR UPDATE USING (
      auth.uid() = customer_id 
      OR is_admin_user()
    );

-- 7. Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;

-- 8. Add comments
COMMENT ON FUNCTION is_admin_user() IS 'Simple helper function to check if current user is admin';

