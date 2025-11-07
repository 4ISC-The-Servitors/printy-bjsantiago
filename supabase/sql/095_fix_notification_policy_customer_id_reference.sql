-- Migration 095: Fix notification insert policies - fix customer_id reference issue
-- The previous policy had ambiguous customer_id references in subqueries
-- This fixes the RLS policy violation when customers try to notify admins

-- Drop existing insert policies
DROP POLICY IF EXISTS "Customers can notify admins" ON public.notifications;
DROP POLICY IF EXISTS "Admins can notify customers" ON public.notifications;

-- Policy 1: Allow customers to insert notifications ONLY for admins (not customers, not themselves)
-- This allows customers to notify admins when customer performs actions
CREATE POLICY "Customers can notify admins"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  -- Current user must be a customer (not admin)
  EXISTS (
    SELECT 1
    FROM public.customer
    WHERE customer_id = (SELECT auth.uid())
    AND customer_type != 'admin'
  )
  -- Recipient (customer_id column being inserted) must be an admin (not customer, not self)
  AND (
    SELECT customer_type
    FROM public.customer
    WHERE customer_id = notifications.customer_id
  ) = 'admin'
  AND notifications.customer_id != (SELECT auth.uid())
);

-- Policy 2: Allow admins to insert notifications ONLY for customers (not admins, not themselves)
-- This allows admins to notify customers when admin performs actions
CREATE POLICY "Admins can notify customers"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  -- Current user must be an admin
  EXISTS (
    SELECT 1
    FROM public.customer
    WHERE customer_id = (SELECT auth.uid())
    AND customer_type = 'admin'
  )
  -- Recipient (customer_id column being inserted) must be a customer (not admin, not self)
  AND (
    SELECT customer_type
    FROM public.customer
    WHERE customer_id = notifications.customer_id
  ) != 'admin'
  AND notifications.customer_id != (SELECT auth.uid())
);

-- Add comments for documentation
COMMENT ON POLICY "Customers can notify admins" ON public.notifications IS 
'Allows customers to insert notifications for admins only. Prevents customers from notifying other customers or themselves.';

COMMENT ON POLICY "Admins can notify customers" ON public.notifications IS 
'Allows admins to insert notifications for customers only. Prevents admins from notifying other admins or themselves.';

