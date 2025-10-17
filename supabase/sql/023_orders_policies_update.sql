-- Ensure orders_duplicate have proper RLS aligned with quote-first conversion

alter table public.orders_duplicate enable row level security;

-- Customers can select their own orders_duplicate
drop policy if exists "select own orders_duplicate" on public.orders_duplicate;
create policy "select own orders_duplicate" on public.orders_duplicate
  for select to authenticated using (customer_id = auth.uid());

-- Disallow direct customer inserts by default (orders_duplicate are created via conversion)
drop policy if exists "insert own orders_duplicate" on public.orders_duplicate;

-- Admins manage all
drop policy if exists "admin all orders_duplicate" on public.orders_duplicate;
create policy "admin all orders_duplicate" on public.orders_duplicate
  for all to authenticated using (
    exists (select 1 from auth.users u where u.id = auth.uid() and u.raw_app_meta_data->>'role' = 'admin')
  ) with check (
    exists (select 1 from auth.users u where u.id = auth.uid() and u.raw_app_meta_data->>'role' = 'admin')
  );



