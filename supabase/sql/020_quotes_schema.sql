-- Customer Quotes schema (quote-first ordering)
-- Stores the evolving spec JSON and the final quoted price once admin confirms.

create table if not exists public.customer_quotes (
  quote_id uuid primary key default gen_random_uuid(),
  inquiry_id uuid,
  customer_id uuid not null,
  status text not null check (status in ('draft','proposed','agreed','rejected')) default 'draft',
  spec jsonb not null default '{}'::jsonb,
  quoted_price numeric, -- final price set by admin upon agreement (no negotiated_price column)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cquotes_inquiry on public.customer_quotes(inquiry_id);
create index if not exists idx_cquotes_customer on public.customer_quotes(customer_id);

-- Conditionally add foreign key to inquiries: supports either inquiry_id or id as PK
do $$ begin
  -- ensure column exists in case of previous failed attempts
  begin
    alter table public.customer_quotes add column if not exists inquiry_id uuid;
  exception when duplicate_column then
    -- no-op
  end;

  -- drop previous constraint if exists
  if exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='customer_quotes' and constraint_name='cquotes_inquiry_fk'
  ) then
    alter table public.customer_quotes drop constraint cquotes_inquiry_fk;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='inquiries' and column_name='inquiry_id'
  ) then
    alter table public.customer_quotes
      add constraint cquotes_inquiry_fk foreign key (inquiry_id)
      references public.inquiries(inquiry_id) on delete cascade;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='inquiries' and column_name='id'
  ) then
    alter table public.customer_quotes
      add constraint cquotes_inquiry_fk foreign key (inquiry_id)
      references public.inquiries(id) on delete cascade;
  end if;
end $$;



