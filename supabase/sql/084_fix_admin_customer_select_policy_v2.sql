-- Fix recursion in customer RLS by using a SECURITY DEFINER helper
-- Creates priv.is_admin() and rewrites the admin SELECT policy to call it

-- Create a private helper schema if missing
CREATE SCHEMA IF NOT EXISTS priv;

-- Helper: returns true if the current auth.uid() is an admin based on
-- the customer table. SECURITY DEFINER prevents RLS recursion.
CREATE OR REPLACE FUNCTION priv.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customer c
    WHERE c.customer_id = auth.uid()
      AND c.customer_type = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION priv.is_admin() TO authenticated, service_role, anon;

-- Rewrite the customer admin policy to avoid self-referencing subqueries
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customer;

CREATE POLICY "Admins can view all customers" ON public.customer
  FOR SELECT
  USING (priv.is_admin());

COMMENT ON POLICY "Admins can view all customers" ON public.customer IS
  'Admins (from customer table) can SELECT all customer rows, via SECURITY DEFINER check.';


