-- Migration 093: Fix RLS policies for inquiries_v2 table
-- Requirements:
--   - All admins can read/view/update all tickets
--   - Customers can read/view/update only their own tickets

-- Drop existing policies
DROP POLICY IF EXISTS "admin all inquiries v2" ON public.inquiries_v2;
DROP POLICY IF EXISTS "select own inquiries v2" ON public.inquiries_v2;
DROP POLICY IF EXISTS "update own inquiries v2" ON public.inquiries_v2;
DROP POLICY IF EXISTS "insert own inquiries v2" ON public.inquiries_v2;

-- Policy 1: Admins can SELECT all tickets
CREATE POLICY "Admins can view all tickets"
ON public.inquiries_v2
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.customer
    WHERE customer_id = (SELECT auth.uid())
    AND customer_type = 'admin'
  )
);

-- Policy 2: Customers can SELECT only their own tickets
CREATE POLICY "Customers can view own tickets"
ON public.inquiries_v2
FOR SELECT
TO authenticated
USING (
  customer_id = (SELECT auth.uid())
  AND NOT EXISTS (
    SELECT 1
    FROM public.customer
    WHERE customer_id = (SELECT auth.uid())
    AND customer_type = 'admin'
  )
);

-- Policy 3: Admins can UPDATE all tickets
CREATE POLICY "Admins can update all tickets"
ON public.inquiries_v2
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.customer
    WHERE customer_id = (SELECT auth.uid())
    AND customer_type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.customer
    WHERE customer_id = (SELECT auth.uid())
    AND customer_type = 'admin'
  )
);

-- Policy 4: Customers can UPDATE only their own tickets
CREATE POLICY "Customers can update own tickets"
ON public.inquiries_v2
FOR UPDATE
TO authenticated
USING (
  customer_id = (SELECT auth.uid())
  AND NOT EXISTS (
    SELECT 1
    FROM public.customer
    WHERE customer_id = (SELECT auth.uid())
    AND customer_type = 'admin'
  )
)
WITH CHECK (
  customer_id = (SELECT auth.uid())
  AND NOT EXISTS (
    SELECT 1
    FROM public.customer
    WHERE customer_id = (SELECT auth.uid())
    AND customer_type = 'admin'
  )
);

-- Policy 5: Customers can INSERT their own tickets
CREATE POLICY "Customers can insert own tickets"
ON public.inquiries_v2
FOR INSERT
TO authenticated
WITH CHECK (
  customer_id = (SELECT auth.uid())
);

-- Add comments for documentation
COMMENT ON POLICY "Admins can view all tickets" ON public.inquiries_v2 IS 
'Allows admins to read/view all tickets in the system.';

COMMENT ON POLICY "Customers can view own tickets" ON public.inquiries_v2 IS 
'Allows customers to read/view only their own tickets.';

COMMENT ON POLICY "Admins can update all tickets" ON public.inquiries_v2 IS 
'Allows admins to update any ticket in the system.';

COMMENT ON POLICY "Customers can update own tickets" ON public.inquiries_v2 IS 
'Allows customers to update only their own tickets.';

COMMENT ON POLICY "Customers can insert own tickets" ON public.inquiries_v2 IS 
'Allows customers to create new tickets for themselves.';

