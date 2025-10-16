create table public.quote_orders (
  quote_order_id uuid not null default gen_random_uuid (),
  conversation_id uuid not null,
  proposal_id uuid not null,
  order_id character varying not null,
  created_at timestamp with time zone not null default now(),
  constraint quote_orders_pkey primary key (quote_order_id),
  constraint quote_orders_conversation_id_fkey foreign KEY (conversation_id) references quote_conversations (conversation_id) on delete CASCADE,
  constraint quote_orders_proposal_id_fkey foreign KEY (proposal_id) references quote_proposals (proposal_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quote_orders_conversation_id on public.quote_orders using btree (conversation_id) TABLESPACE pg_default;

create index IF not exists idx_quote_orders_proposal_id on public.quote_orders using btree (proposal_id) TABLESPACE pg_default;