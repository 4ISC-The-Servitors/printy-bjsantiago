-- Notifications INSERT RLS policy
-- Allows:
-- 1) users to insert notifications for themselves
-- 2) admins to insert notifications for anyone
-- 3) any user to insert notifications targeting admin recipients (customer_id is an admin)

-- Enable RLS (no-op if already enabled)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if present to avoid duplicates
DROP POLICY IF EXISTS "notifications_insert_allowed" ON public.notifications;

CREATE POLICY "notifications_insert_allowed"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Self notifications
    customer_id = auth.uid()
    OR
    -- Admin inserting for anyone (admin determined via customer_type)
    EXISTS (
      SELECT 1 FROM get_admin_customer_ids() a
      WHERE a.customer_id = auth.uid()
    )
    OR
    -- Allow inserts when the recipient is an admin (so customers can notify admins)
    EXISTS (
      SELECT 1 FROM get_admin_customer_ids() a
      WHERE a.customer_id = customer_id
    )
  );


