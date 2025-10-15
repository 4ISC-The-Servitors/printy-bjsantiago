-- Align *_duplicate tables for safe testing with quote-first flow

-- quotes_duplicate: add modern quote fields without dropping legacy ones
alter table if exists public.quotes_duplicate
  add column if not exists inquiry_id uuid,
  add column if not exists customer_id uuid,
  add column if not exists status text,
  add column if not exists spec jsonb,
  add column if not exists quoted_price numeric,
  add column if not exists notes text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

-- defaults and constraints
do $$ begin
  begin
    alter table public.quotes_duplicate alter column status set default 'draft';
  exception when undefined_column then null; end;
  begin
    alter table public.quotes_duplicate alter column spec set default '{}'::jsonb;
  exception when undefined_column then null; end;
  begin
    alter table public.quotes_duplicate alter column created_at set default now();
  exception when undefined_column then null; end;
  begin
    alter table public.quotes_duplicate alter column updated_at set default now();
  exception when undefined_column then null; end;
  -- add check if not present
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_schema='public' and constraint_name='quotes_dup_status_check'
  ) then
    alter table public.quotes_duplicate add constraint quotes_dup_status_check
      check (status in ('draft','proposed','agreed','rejected'));
  end if;
end $$;

create index if not exists idx_qdup_inquiry on public.quotes_duplicate(inquiry_id);
create index if not exists idx_qdup_customer on public.quotes_duplicate(customer_id);

-- Try to link FK to inquiries_duplicate first, else inquiries
do $$ begin
  -- drop old fk if exists
  if exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='quotes_duplicate' and constraint_name='quotes_dup_inquiry_fk'
  ) then
    alter table public.quotes_duplicate drop constraint quotes_dup_inquiry_fk;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='inquiries_duplicate' and column_name='inquiry_id'
  ) then
    alter table public.quotes_duplicate
      add constraint quotes_dup_inquiry_fk foreign key (inquiry_id)
      references public.inquiries_duplicate(inquiry_id) on delete set null;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='inquiries' and column_name='inquiry_id'
  ) then
    alter table public.quotes_duplicate
      add constraint quotes_dup_inquiry_fk foreign key (inquiry_id)
      references public.inquiries(inquiry_id) on delete set null;
  end if;
end $$;

-- orders_duplicate: add linkage and spec snapshot
alter table if exists public.orders_duplicate
  add column if not exists quote_id uuid,
  add column if not exists quoted_price numeric,
  add column if not exists spec jsonb;

create index if not exists idx_odup_quote on public.orders_duplicate(quote_id);


