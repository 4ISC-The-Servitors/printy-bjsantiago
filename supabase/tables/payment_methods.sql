create table public.payment_methods (
  method_id uuid not null default gen_random_uuid (),
  method_type text not null,
  image_url text not null,
  label text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint payment_methods_pkey primary key (method_id),
  constraint payment_methods_method_type_check check (
    (
      method_type = any (array['bank_transfer'::text, 'qrph'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_payment_methods_type on public.payment_methods using btree (method_type) TABLESPACE pg_default;

create index IF not exists idx_payment_methods_active on public.payment_methods using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_payment_methods_display_order on public.payment_methods using btree (display_order) TABLESPACE pg_default;

create trigger update_payment_methods_updated_at BEFORE
update on payment_methods for EACH row
execute FUNCTION update_payment_methods_updated_at ();