-- Create RPC function to get admin customer_ids (bypasses RLS)
-- This is needed for customers to create notifications for admins
-- without being able to read the admin customer table rows

CREATE OR REPLACE FUNCTION get_admin_customer_ids()
RETURNS TABLE (customer_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT c.customer_id
  FROM customer c
  WHERE c.customer_type = 'admin';
END;
$$;

-- Grant execute permission to authenticated users (customers)
GRANT EXECUTE ON FUNCTION get_admin_customer_ids() TO authenticated;

COMMENT ON FUNCTION get_admin_customer_ids() IS 'Returns customer_ids of all admin users. Used for creating notifications when customers accept/reject quotes. Runs with SECURITY DEFINER to bypass RLS.';
