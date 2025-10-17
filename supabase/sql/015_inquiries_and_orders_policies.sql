-- RLS policies for inquiries and orders used by Issue Ticket flow

-- inquiries
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Customers can select their own inquiries
DROP POLICY IF EXISTS "select own inquiries" ON public.inquiries;
CREATE POLICY "select own inquiries" ON public.inquiries
  FOR SELECT TO authenticated USING (customer_id = auth.uid());

-- Customers can insert their own inquiries
DROP POLICY IF EXISTS "insert own inquiries" ON public.inquiries;
CREATE POLICY "insert own inquiries" ON public.inquiries
  FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());

-- Optional: allow admins to manage all
DROP POLICY IF EXISTS "admin all inquiries" ON public.inquiries;
CREATE POLICY "admin all inquiries" ON public.inquiries
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_app_meta_data->>'role' = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_app_meta_data->>'role' = 'admin')
  );


