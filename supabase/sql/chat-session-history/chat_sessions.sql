create table public.chat_sessions (
  created_at timestamp with time zone not null default now(),
  status text null,
  feedback_rating smallint null,
  customer_id uuid not null,
  session_id uuid not null,
  inquiry_id uuid null,
  metadata jsonb null default '{}'::jsonb,
  constraint chatbot_pkey primary key (session_id),
  constraint chat_sessions_inquiry_id_fkey foreign KEY (inquiry_id) references inquiries (inquiry_id) on delete set null,
  constraint chatbot_customer_id_fkey foreign KEY (customer_id) references customer (customer_id) on delete set null,
  constraint chat_sessions_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'ended'::text,
          'archived'::text,
          'deleted'::text
        ]
      )
    )
  ),
  constraint chatbot_feedback_rating_check check (
    (
      (feedback_rating >= 1)
      and (feedback_rating <= 5)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_chat_sessions_inquiry on public.chat_sessions using btree (inquiry_id) TABLESPACE pg_default;

create index IF not exists idx_chatbot_customer_id on public.chat_sessions using btree (customer_id) TABLESPACE pg_default;

create index IF not exists idx_chat_sessions_quote_conversation on public.chat_sessions using btree (((metadata ->> 'quote_conversation_id'::text))) TABLESPACE pg_default;

-- sample table data:
insert into public.chat_sessions (
  created_at, status, feedback_rating, customer_id, session_id, inquiry_id, metadata
) values
  ('2025-10-14 06:40:27.60074+00', 'active', null, '6de97dd0-b16d-4f49-ba50-b233dced944c', '007fb093-77de-44ee-8bd7-5865aa86f051', null, '{}'),
  ('2025-10-03 08:28:10.251535+00', 'ended', null, '23d9d2d6-23cc-4662-af88-6b555811cfb4', '061b2b04-ad0c-4db1-92cd-18e7a1ea0316', null, '{}');