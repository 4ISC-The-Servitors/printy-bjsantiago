create table public.quote_proposals (
  proposal_id uuid not null default gen_random_uuid (),
  spec_id uuid not null,
  spec_final jsonb not null default '{}'::jsonb,
  quoted_price numeric not null,
  notes text null,
  status text not null default 'draft'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  sent_at timestamp with time zone null,
  session_id uuid not null,
  constraint quote_proposals_pkey primary key (proposal_id),
  constraint quote_proposals_session_id_fkey foreign KEY (session_id) references chat_sessions_v2 (session_id) on delete CASCADE,
  constraint quote_proposals_spec_id_fkey foreign KEY (spec_id) references quote_specs (spec_id) on delete CASCADE,
  constraint quote_proposals_quoted_price_check check ((quoted_price > (0)::numeric)),
  constraint quote_proposals_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'sent'::text,
          'accepted'::text,
          'rejected'::text,
          'expired'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_quote_proposals_status on public.quote_proposals using btree (status) TABLESPACE pg_default;

create index IF not exists idx_quote_proposals_session_id on public.quote_proposals using btree (session_id) TABLESPACE pg_default;

create trigger update_quote_proposals_updated_at BEFORE
update on quote_proposals for EACH row
execute FUNCTION update_updated_at_column ();