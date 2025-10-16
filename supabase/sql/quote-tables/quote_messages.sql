create table public.quote_messages (
  message_id uuid not null default gen_random_uuid (),
  conversation_id uuid not null,
  sender_id uuid not null,
  sender_role text not null,
  message_text text not null,
  message_type text not null default 'chat'::text,
  metadata jsonb null default '{}'::jsonb,
  sent_at timestamp with time zone not null default now(),
  constraint quote_messages_pkey primary key (message_id),
  constraint quote_messages_conversation_id_fkey foreign KEY (conversation_id) references quote_conversations (conversation_id) on delete CASCADE,
  constraint quote_messages_sender_id_fkey foreign KEY (sender_id) references customer (customer_id) on delete CASCADE,
  constraint quote_messages_message_type_check check (
    (
      message_type = any (
        array[
          'chat'::text,
          'spec_summary'::text,
          'spec_proposal'::text,
          'system'::text
        ]
      )
    )
  ),
  constraint quote_messages_sender_role_check check (
    (
      sender_role = any (
        array[
          'customer'::text,
          'admin'::text,
          'printy'::text,
          'ai'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_quote_messages_conversation_id on public.quote_messages using btree (conversation_id) TABLESPACE pg_default;

create index IF not exists idx_quote_messages_sent_at on public.quote_messages using btree (sent_at) TABLESPACE pg_default;

create index IF not exists idx_quote_messages_sender_role on public.quote_messages using btree (sender_role) TABLESPACE pg_default;