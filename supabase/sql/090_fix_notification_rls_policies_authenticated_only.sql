-- Migration 090: Update notification RLS policies to only allow authenticated users
-- Redo SELECT, INSERT, UPDATE, and DELETE policies to restrict access to authenticated users only

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;

-- Policy 1: Allow authenticated users to read notifications sent to them
CREATE POLICY "Users can read own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = customer_id
);

-- Policy 2: Allow authenticated users to insert notifications for themselves
CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = customer_id
);

-- Policy 3: Allow authenticated users to update notifications sent to them
-- This allows admins to update notifications sent to customers and vice versa
-- (admin can update customer notifications, customer can update admin notifications)
CREATE POLICY "Users can update notifications sent to them"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = customer_id
)
WITH CHECK (
  (SELECT auth.uid()) = customer_id
);

-- Policy 4: Allow authenticated users to delete notifications sent to them
CREATE POLICY "Users delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (
  (SELECT auth.uid()) = customer_id
);

