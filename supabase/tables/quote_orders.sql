create table public.quote_orders (
  quote_order_id uuid not null default gen_random_uuid (),
  proposal_id uuid not null,
  order_id uuid not null,
  created_at timestamp with time zone not null default now(),
  session_id uuid not null,
  constraint quote_orders_pkey primary key (quote_order_id),
  constraint quote_orders_order_id_fkey foreign KEY (order_id) references orders (order_id) on delete CASCADE,
  constraint quote_orders_proposal_id_fkey foreign KEY (proposal_id) references quote_proposals (proposal_id) on delete CASCADE,
  constraint quote_orders_session_id_fkey foreign KEY (session_id) references chat_sessions_v2 (session_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quote_orders_session_id on public.quote_orders using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_quote_orders_proposal_id on public.quote_orders using btree (proposal_id) TABLESPACE pg_default;

create index IF not exists idx_quote_orders_order_id on public.quote_orders using btree (order_id) TABLESPACE pg_default;