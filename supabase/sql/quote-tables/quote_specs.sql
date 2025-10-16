create table public.quote_specs (
  spec_id uuid not null default gen_random_uuid (),
  conversation_id uuid not null,
  spec_data jsonb not null default '{}'::jsonb,
  trigger_message_id uuid null,
  created_at timestamp with time zone not null default now(),
  constraint quote_specs_pkey primary key (spec_id),
  constraint quote_specs_conversation_id_fkey foreign KEY (conversation_id) references quote_conversations (conversation_id) on delete CASCADE,
  constraint quote_specs_trigger_message_id_fkey foreign KEY (trigger_message_id) references quote_messages (message_id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_quote_specs_conversation_id on public.quote_specs using btree (conversation_id) TABLESPACE pg_default;

create index IF not exists idx_quote_specs_created_at on public.quote_specs using btree (created_at desc) TABLESPACE pg_default;