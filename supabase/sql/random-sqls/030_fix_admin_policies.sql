-- Migration 030: Fix admin RLS policies for inquiries_duplicate and related tables
-- This migration creates proper policies for admin users to access customer data

-- 1. Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries_duplicate;
DROP POLICY IF EXISTS "Users can insert own inquiries" ON inquiries_duplicate;
DROP POLICY IF EXISTS "Users can update own inquiries" ON inquiries_duplicate;

DROP POLICY IF EXISTS "Users can view own orders" ON orders_duplicate;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders_duplicate;
DROP POLICY IF EXISTS "Users can update own orders" ON orders_duplicate;

DROP POLICY IF EXISTS "Users can view own quotes" ON quotes_duplicate;
DROP POLICY IF EXISTS "Users can insert own quotes" ON quotes_duplicate;
DROP POLICY IF EXISTS "Users can update own quotes" ON quotes_duplicate;

-- 2. Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
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

-- 3. Create comprehensive policies for inquiries_duplicate
-- Regular users can only see their own inquiries
CREATE POLICY "Regular users can view own inquiries" ON inquiries_duplicate
    FOR SELECT USING (
      auth.uid() = customer_id 
      AND NOT is_admin()
    );

-- Regular users can insert their own inquiries
CREATE POLICY "Regular users can insert own inquiries" ON inquiries_duplicate
    FOR INSERT WITH CHECK (
      auth.uid() = customer_id 
      AND NOT is_admin()
    );

-- Regular users can update their own inquiries
CREATE POLICY "Regular users can update own inquiries" ON inquiries_duplicate
    FOR UPDATE USING (
      auth.uid() = customer_id 
      AND NOT is_admin()
    );

-- Admins can see all inquiries
CREATE POLICY "Admins can view all inquiries" ON inquiries_duplicate
    FOR SELECT USING (is_admin());

-- Admins can insert inquiries for any customer
CREATE POLICY "Admins can insert inquiries" ON inquiries_duplicate
    FOR INSERT WITH CHECK (is_admin());

-- Admins can update any inquiry
CREATE POLICY "Admins can update any inquiry" ON inquiries_duplicate
    FOR UPDATE USING (is_admin());

-- 4. Create comprehensive policies for orders_duplicate
-- Regular users can only see their own orders
CREATE POLICY "Regular users can view own orders" ON orders_duplicate
    FOR SELECT USING (
      auth.uid() = customer_id 
      AND NOT is_admin()
    );

-- Regular users can insert their own orders
CREATE POLICY "Regular users can insert own orders" ON orders_duplicate
    FOR INSERT WITH CHECK (
      auth.uid() = customer_id 
      AND NOT is_admin()
    );

-- Regular users can update their own orders
CREATE POLICY "Regular users can update own orders" ON orders_duplicate
    FOR UPDATE USING (
      auth.uid() = customer_id 
      AND NOT is_admin()
    );

-- Admins can see all orders
CREATE POLICY "Admins can view all orders" ON orders_duplicate
    FOR SELECT USING (is_admin());

-- Admins can insert orders for any customer
CREATE POLICY "Admins can insert orders" ON orders_duplicate
    FOR INSERT WITH CHECK (is_admin());

-- Admins can update any order
CREATE POLICY "Admins can update any order" ON orders_duplicate
    FOR UPDATE USING (is_admin());

-- 5. Create comprehensive policies for quotes_duplicate
-- Regular users can only see their own quotes
CREATE POLICY "Regular users can view own quotes" ON quotes_duplicate
    FOR SELECT USING (
      auth.uid() = customer_id 
      AND NOT is_admin()
    );

-- Regular users can insert their own quotes
CREATE POLICY "Regular users can insert own quotes" ON quotes_duplicate
    FOR INSERT WITH CHECK (
      auth.uid() = customer_id 
      AND NOT is_admin()
    );

-- Regular users can update their own quotes
CREATE POLICY "Regular users can update own quotes" ON quotes_duplicate
    FOR UPDATE USING (
      auth.uid() = customer_id 
      AND NOT is_admin()
    );

-- Admins can see all quotes
CREATE POLICY "Admins can view all quotes" ON quotes_duplicate
    FOR SELECT USING (is_admin());

-- Admins can insert quotes for any customer
CREATE POLICY "Admins can insert quotes" ON quotes_duplicate
    FOR INSERT WITH CHECK (is_admin());

-- Admins can update any quote
CREATE POLICY "Admins can update any quote" ON quotes_duplicate
    FOR UPDATE USING (is_admin());

-- 6. Create policies for customer table access
-- Regular users can view their own customer record
CREATE POLICY "Users can view own customer record" ON customer
    FOR SELECT USING (auth.uid() = customer_id);

-- Admins can view all customer records
CREATE POLICY "Admins can view all customer records" ON customer
    FOR SELECT USING (is_admin());

-- 7. Create policies for chat sessions and messages (admin access)
-- Admins can view all chat sessions
CREATE POLICY "Admins can view all chat sessions" ON chat_sessions
    FOR SELECT USING (is_admin());

-- Regular users can view their own chat sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT USING (
      auth.uid() = customer_id 
      AND NOT is_admin()
    );

-- Admins can view all chat messages
CREATE POLICY "Admins can view all chat messages" ON chat_messages
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM chat_sessions cs 
        WHERE cs.session_id = chat_messages.session_id 
        AND is_admin()
      )
    );

-- Regular users can view their own chat messages
CREATE POLICY "Users can view own chat messages" ON chat_messages
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM chat_sessions cs 
        WHERE cs.session_id = chat_messages.session_id 
        AND cs.customer_id = auth.uid()
        AND NOT is_admin()
      )
    );

-- 8. Create policies for chat session flow (admin access)
-- Admins can view all chat session flows
CREATE POLICY "Admins can view all chat session flows" ON chat_session_flow
    FOR SELECT USING (is_admin());

-- Regular users can view their own chat session flows
CREATE POLICY "Users can view own chat session flows" ON chat_session_flow
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM chat_sessions cs 
        WHERE cs.session_id = chat_session_flow.session_id 
        AND cs.customer_id = auth.uid()
        AND NOT is_admin()
      )
    );

-- 9. Create policies for chat message meta (admin access)
-- Admins can view all chat message meta
CREATE POLICY "Admins can view all chat message meta" ON chat_message_meta
    FOR SELECT USING (is_admin());

-- Regular users can view their own chat message meta
CREATE POLICY "Users can view own chat message meta" ON chat_message_meta
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM chat_messages cm
        JOIN chat_sessions cs ON cs.session_id = cm.session_id
        WHERE cm.message_id = chat_message_meta.message_id
        AND cs.customer_id = auth.uid()
        AND NOT is_admin()
      )
    );

-- 10. Add comments for documentation
COMMENT ON FUNCTION is_admin() IS 'Helper function to check if the current user is an admin based on customer_type';

-- Grant execute permission on the helper function to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

