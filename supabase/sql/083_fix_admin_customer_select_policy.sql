-- Ensure admins (based on customer.customer_type) can read all customer rows
-- This fixes cases where some admin accounts lack JWT metadata and thus fail
-- to join customer names in admin views (orders, tickets, etc.).

-- Enable RLS if not already enabled (safe to run repeatedly)
ALTER TABLE public.customer ENABLE ROW LEVEL SECURITY;

-- Drop and recreate an explicit admin SELECT policy for customer table
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customer;

CREATE POLICY "Admins can view all customers" ON public.customer
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.customer AS self
      WHERE self.customer_id = auth.uid()
        AND self.customer_type = 'admin'
    )
  );

-- Keep existing self-access policies intact (not modified here)

COMMENT ON POLICY "Admins can view all customers" ON public.customer IS
  'Allows any user whose own row has customer_type=admin to SELECT all customer rows.';


