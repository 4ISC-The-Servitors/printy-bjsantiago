-- Migration 089: Fix notification insert policies
-- This fixes the "Customers can notify admins" and "Admins can insert notifications" policies

-- Drop existing policies
DROP POLICY IF EXISTS "Customers can notify admins" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;

-- Policy 1: Allow admins to insert notifications for any customer
-- This allows admins to notify customers (e.g., when admin updates a quote)
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.customer
    WHERE customer_id = (SELECT auth.uid())
    AND customer_type = 'admin'
  )
);

-- Policy 2: Allow customers to insert notifications where the recipient (customer_id) is an admin
-- This allows customers to notify admins when they perform actions like accepting quotes or creating tickets
CREATE POLICY "Customers can notify admins"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.customer c
    WHERE c.customer_id = customer_id
    AND c.customer_type = 'admin'
  )
);

