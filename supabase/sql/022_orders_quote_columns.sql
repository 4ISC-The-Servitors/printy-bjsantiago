-- Add quote linkage and spec snapshot to orders_duplicate

alter table public.orders_duplicate
  add column if not exists quote_id uuid references public.quotes(quote_id) on delete set null,
  add column if not exists quoted_price numeric,
  add column if not exists spec jsonb;

create index if not exists idx_orders_duplicate_quote on public.orders_duplicate(quote_id);



