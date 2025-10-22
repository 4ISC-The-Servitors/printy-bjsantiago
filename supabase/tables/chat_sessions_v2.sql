create table public.chat_sessions_v2 (
  session_id uuid not null default gen_random_uuid (),
  flow_id text null,
  customer_id uuid not null,
  status text null default 'active'::text,
  created_at timestamp with time zone null default now(),
  ended_at timestamp with time zone null,
  metadata jsonb null default '{}'::jsonb,
  inquiry_id uuid null,
  quote_id uuid null,
  display_title text GENERATED ALWAYS as (
    COALESCE(
      (metadata ->> 'title'::text),
      flow_id,
      'Chat'::text
    )
  ) STORED null,
  constraint chat_sessions_v2_pkey primary key (session_id),
  constraint chat_sessions_v2_customer_id_fkey foreign KEY (customer_id) references auth.users (id),
  constraint chat_sessions_v2_flow_id_fkey foreign KEY (flow_id) references chat_flows_v2 (flow_id),
  constraint chat_sessions_v2_inquiry_id_fkey foreign KEY (inquiry_id) references inquiries (inquiry_id) on delete set null,
  constraint chat_sessions_v2_quote_id_fkey foreign KEY (quote_id) references quotes (quote_id) on delete set null,
  constraint chat_sessions_v2_status_check check (
    (
      status = any (array['active'::text, 'ended'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_chat_sessions_v2_quote_display_id on public.chat_sessions_v2 using btree (
  (
    (
      (metadata -> 'quote'::text) ->> 'display_id'::text
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_chat_sessions_display_title on public.chat_sessions_v2 using btree (display_title) TABLESPACE pg_default;

create index IF not exists idx_chat_sessions_customer_created on public.chat_sessions_v2 using btree (customer_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_chat_sessions_admin_chat on public.chat_sessions_v2 using gin (((metadata -> 'admin_chat'::text))) TABLESPACE pg_default;

create index IF not exists idx_chat_sessions_v2_customer_id on public.chat_sessions_v2 using btree (customer_id) TABLESPACE pg_default;

create index IF not exists idx_chat_sessions_v2_status on public.chat_sessions_v2 using btree (status) TABLESPACE pg_default
where
  (status = 'active'::text);

create index IF not exists idx_chat_sessions_v2_inquiry on public.chat_sessions_v2 using btree (inquiry_id) TABLESPACE pg_default
where
  (inquiry_id is not null);

create index IF not exists idx_chat_sessions_v2_quote on public.chat_sessions_v2 using btree (quote_id) TABLESPACE pg_default
where
  (quote_id is not null);

create index IF not exists idx_chat_sessions_v2_quote_status on public.chat_sessions_v2 using btree (
  (((metadata -> 'quote'::text) ->> 'status'::text))
) TABLESPACE pg_default;

create index IF not exists idx_chat_sessions_v2_flow_id on public.chat_sessions_v2 using btree (flow_id) TABLESPACE pg_default
where
  (flow_id = 'ask-quote'::text);

create index IF not exists idx_chat_sessions_v2_inquiry_id on public.chat_sessions_v2 using btree (inquiry_id) TABLESPACE pg_default;

create index IF not exists idx_chat_sessions_v2_quote_id on public.chat_sessions_v2 using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_sessions_v2_customer on public.chat_sessions_v2 using btree (customer_id) TABLESPACE pg_default;

create index IF not exists idx_sessions_v2_status on public.chat_sessions_v2 using btree (status) TABLESPACE pg_default;

create index IF not exists idx_sessions_v2_flow on public.chat_sessions_v2 using btree (flow_id) TABLESPACE pg_default;

create index IF not exists idx_chat_sessions_v2_metadata_gin on public.chat_sessions_v2 using gin (metadata) TABLESPACE pg_default;