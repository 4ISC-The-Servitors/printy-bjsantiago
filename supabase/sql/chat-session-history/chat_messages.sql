create table public.chat_messages (
  message_id uuid not null default gen_random_uuid (),
  session_id uuid null,
  sent_at timestamp with time zone not null default now(),
  message_text_enc bytea null,
  constraint messages_pkey primary key (message_id),
  constraint messages_session_id_fkey foreign KEY (session_id) references chat_sessions (session_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_messages_session_sent_at on public.chat_messages using btree (session_id, sent_at desc) TABLESPACE pg_default;

-- theres chat_messages_secure table in Supabase that is encrypted and decrypted views
-- message_text_enc is the encrypted column but message_text is the decrypted column in the views