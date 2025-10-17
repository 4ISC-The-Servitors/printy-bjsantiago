create table public.chat_messages_v2 (
  message_id uuid not null default gen_random_uuid (),
  session_id uuid null,
  sender_role text not null,
  message_text_enc bytea not null,
  sent_at timestamp with time zone null default now(),
  metadata jsonb null default '{}'::jsonb,
  constraint chat_messages_v2_pkey primary key (message_id),
  constraint chat_messages_v2_session_id_fkey foreign KEY (session_id) references chat_sessions_v2 (session_id) on delete CASCADE,
  constraint chat_messages_v2_sender_role_check check (
    (
      sender_role = any (
        array['customer'::text, 'admin'::text, 'printy'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_messages_v2_session on public.chat_messages_v2 using btree (session_id, sent_at) TABLESPACE pg_default;