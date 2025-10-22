create table public.quotes (
  quote_id uuid not null default gen_random_uuid (),
  customer_id uuid not null,
  session_id uuid not null,
  status text not null default 'active'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  ended_at timestamp with time zone null,
  display_id character varying(20) null,
  constraint quotes_pkey primary key (quote_id),
  constraint quotes_display_id_key unique (display_id),
  constraint quotes_customer_id_fkey foreign KEY (customer_id) references customer (customer_id) on delete CASCADE,
  constraint quotes_session_id_fkey foreign KEY (session_id) references chat_sessions_v2 (session_id) on delete CASCADE,
  constraint quotes_status_check check (
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

create index IF not exists idx_quotes_display_id on public.quotes using btree (display_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_customer_id on public.quotes using btree (customer_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_quote_id on public.quotes using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_session_id on public.quotes using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_status on public.quotes using btree (status) TABLESPACE pg_default;

create index IF not exists idx_quotes_created_at on public.quotes using btree (created_at desc) TABLESPACE pg_default;

create trigger trg_quote_created_notifications
after INSERT on quotes for EACH row
execute FUNCTION notify_admins_on_quote_created ();

create trigger trigger_quote_notifications
after INSERT
or
update on quotes for EACH row
execute FUNCTION notify_quote_events ();

create trigger update_quotes_updated_at BEFORE
update on quotes for EACH row
execute FUNCTION update_updated_at_column ();