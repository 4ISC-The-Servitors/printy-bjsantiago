-- RLS for inquiries_duplicate to allow admin viewing in Admin Tickets page

alter table public.inquiries_duplicate enable row level security;

-- Customers can select their own inquiries (match original inquiries policy)
drop policy if exists "select own inquiries_dup" on public.inquiries_duplicate;
create policy "select own inquiries_dup" on public.inquiries_duplicate
  for select to authenticated using (customer_id = auth.uid());

-- Optional: customers can insert their own inquiries (if you create via this table)
drop policy if exists "insert own inquiries_dup" on public.inquiries_duplicate;
create policy "insert own inquiries_dup" on public.inquiries_duplicate
  for insert to authenticated with check (customer_id = auth.uid());

-- Admins manage all rows (simplified - check customer table instead)
drop policy if exists "admin all inquiries_dup" on public.inquiries_duplicate;
create policy "admin all inquiries_dup" on public.inquiries_duplicate
  for all to authenticated using (
    exists (select 1 from public.customer c where c.customer_id = auth.uid() and c.customer_type = 'admin')
  ) with check (
    exists (select 1 from public.customer c where c.customer_id = auth.uid() and c.customer_type = 'admin')
  );


