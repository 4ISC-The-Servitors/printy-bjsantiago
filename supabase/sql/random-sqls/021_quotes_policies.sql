-- RLS policies for quotes_duplicate

alter table public.quotes_duplicate enable row level security;

-- Customers can select their own quotes_duplicate
drop policy if exists "select own quotes" on public.quotes_duplicate;
create policy "select own quotes" on public.quotes_duplicate
  for select to authenticated using (customer_id = auth.uid());

-- Customers can insert their own quotes_duplicate (drafts) tied to their inquiry
drop policy if exists "insert own quotes" on public.quotes_duplicate;
create policy "insert own quotes" on public.quotes_duplicate
  for insert to authenticated with check (customer_id = auth.uid());

-- Customers can update own quotes_duplicate during drafting (e.g., spec merges)
drop policy if exists "update own quotes" on public.quotes_duplicate;
create policy "update own quotes" on public.quotes_duplicate
  for update to authenticated using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- Admins manage all quotes_duplicate
drop policy if exists "admin all quotes" on public.quotes_duplicate;
create policy "admin all quotes" on public.quotes_duplicate
  for all to authenticated using (
    exists (select 1 from auth.users u where u.id = auth.uid() and u.raw_app_meta_data->>'role' = 'admin')
  ) with check (
    exists (select 1 from auth.users u where u.id = auth.uid() and u.raw_app_meta_data->>'role' = 'admin')
  );



