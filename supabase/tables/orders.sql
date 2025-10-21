create table public.orders (
  order_id uuid not null default gen_random_uuid (),
  customer_id uuid not null,
  order_specs jsonb not null default '{}'::jsonb,
  total_amount numeric not null,
  status text not null default 'awaiting_payment'::text,
  payment_proof text null,
  payment_verified_at timestamp with time zone null,
  payment_verified_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone null,
  display_id character varying(20) null,
  payment_proof_uploaded_at timestamp with time zone null,
  quote_id uuid null,
  proposal_id uuid null,
  session_id uuid null,
  payment_denied_by uuid null,
  payment_denied_at timestamp with time zone null,
  denial_reason text null,
  constraint orders_duplicate_pkey primary key (order_id),
  constraint orders_duplicate_display_id_key unique (display_id),
  constraint orders_duplicate_proposal_id_fkey foreign KEY (proposal_id) references quote_proposals (proposal_id) on delete set null,
  constraint orders_duplicate_quote_id_fkey foreign KEY (quote_id) references quotes (quote_id) on delete set null,
  constraint orders_session_id_fkey foreign KEY (session_id) references chat_sessions_v2 (session_id),
  constraint orders_duplicate_payment_verified_by_fkey foreign KEY (payment_verified_by) references customer (customer_id) on delete set null,
  constraint orders_payment_denied_by_fkey foreign KEY (payment_denied_by) references customer (customer_id),
  constraint orders_duplicate_customer_id_fkey foreign KEY (customer_id) references customer (customer_id) on delete CASCADE,
  constraint orders_duplicate_status_check check (
    (
      status = any (
        array[
          'awaiting_payment'::text,
          'verifying_payment'::text,
          'reupload_payment'::text,
          'processing'::text,
          'for_delivery'::text,
          'for_pickup'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
  ) not VALID,
  constraint orders_duplicate_total_amount_check check ((total_amount > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_orders_display_id on public.orders using btree (display_id) TABLESPACE pg_default;

create index IF not exists idx_orders_quote_id on public.orders using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_orders_duplicate_proposal_id on public.orders using btree (proposal_id) TABLESPACE pg_default;

create index IF not exists idx_orders_payment_denied_by on public.orders using btree (payment_denied_by) TABLESPACE pg_default;

create index IF not exists idx_orders_payment_denied_at on public.orders using btree (payment_denied_at) TABLESPACE pg_default;

create index IF not exists idx_orders_customer_id on public.orders using btree (customer_id) TABLESPACE pg_default;

create index IF not exists idx_orders_status on public.orders using btree (status) TABLESPACE pg_default;

create index IF not exists idx_orders_created_at on public.orders using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_orders_updated_at on public.orders using btree (updated_at desc) TABLESPACE pg_default;

create trigger set_order_display_id BEFORE INSERT on orders for EACH row
execute FUNCTION generate_order_display_id ();

create trigger trigger_order_notifications
after INSERT
or
update on orders for EACH row
execute FUNCTION notify_order_events ();

create trigger update_orders_updated_at BEFORE
update on orders for EACH row
execute FUNCTION update_orders_updated_at ();