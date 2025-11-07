-- Migration 091: Fix notification insert policies to enforce cross-user notifications only
-- Users must NOT be able to insert notifications for themselves
-- This enforces the vice versa action notification pattern:
--   - Customer actions → trigger admin notifications
--   - Admin actions → trigger customer notifications
--
-- NOTE: This migration only modifies INSERT policies.
-- SELECT, UPDATE, and DELETE policies are kept intact for:
--   - Reading notifications (SELECT)
--   - Marking notifications as read (UPDATE)
--   - Deleting notifications (DELETE)

-- Drop existing insert policies only
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Customers can notify admins" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can notify customers" ON public.notifications;

-- Policy 1: Allow admins to insert notifications ONLY for customers (not admins, not themselves)
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
  -- Recipient (customer_id) must be a customer (not admin, not self)
  AND EXISTS (
    SELECT 1
    FROM public.customer c
    WHERE c.customer_id = customer_id
    AND c.customer_type != 'admin'
    AND c.customer_id != (SELECT auth.uid())
  )
);

-- Policy 2: Allow customers to insert notifications ONLY for admins (not customers, not themselves)
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
  -- Recipient (customer_id) must be an admin (not customer, not self)
  AND EXISTS (
    SELECT 1
    FROM public.customer c
    WHERE c.customer_id = customer_id
    AND c.customer_type = 'admin'
    AND c.customer_id != (SELECT auth.uid())
  )
);

-- Add comments for documentation
COMMENT ON POLICY "Admins can notify customers" ON public.notifications IS 
'Allows admins to insert notifications for customers only. Prevents admins from notifying other admins or themselves.';

COMMENT ON POLICY "Customers can notify admins" ON public.notifications IS 
'Allows customers to insert notifications for admins only. Prevents customers from notifying other customers or themselves.';

