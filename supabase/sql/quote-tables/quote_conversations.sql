create table public.quote_conversations (
  conversation_id uuid not null default gen_random_uuid (),
  customer_id uuid not null,
  quote_id uuid not null default gen_random_uuid (),
  status text not null default 'active'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  ended_at timestamp with time zone null,
  display_id character varying(20) null,
  constraint quote_conversations_pkey primary key (conversation_id),
  constraint quote_conversations_display_id_key unique (display_id),
  constraint quote_conversations_customer_id_fkey foreign KEY (customer_id) references customer (customer_id) on delete CASCADE,
  constraint quote_conversations_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'spec_proposed'::text,
          'accepted'::text,
          'rejected'::text,
          'ended'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_quote_conversations_display_id on public.quote_conversations using btree (display_id) TABLESPACE pg_default;

create index IF not exists idx_quote_conversations_customer_id on public.quote_conversations using btree (customer_id) TABLESPACE pg_default;

create index IF not exists idx_quote_conversations_quote_id on public.quote_conversations using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quote_conversations_status on public.quote_conversations using btree (status) TABLESPACE pg_default;

create index IF not exists idx_quote_conversations_created_at on public.quote_conversations using btree (created_at desc) TABLESPACE pg_default;

create trigger set_quote_display_id BEFORE INSERT on quote_conversations for EACH row
execute FUNCTION generate_quote_display_id ();

create trigger update_quote_conversations_updated_at BEFORE
update on quote_conversations for EACH row
execute FUNCTION update_updated_at_column ();