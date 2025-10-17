create table public.quote_specs (
  spec_id uuid not null default gen_random_uuid (),
  spec_data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  session_id uuid not null,
  constraint quote_specs_pkey primary key (spec_id),
  constraint quote_specs_session_id_fkey foreign KEY (session_id) references chat_sessions_v2 (session_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quote_specs_created_at on public.quote_specs using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_quote_specs_session_id on public.quote_specs using btree (session_id) TABLESPACE pg_default;