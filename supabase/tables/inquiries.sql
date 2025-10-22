create table public.inquiries (
  inquiry_status text null default 'new'::text,
  resolution_comments text null,
  received_at timestamp with time zone not null default now(),
  inquiry_id uuid not null default gen_random_uuid (),
  inquiry_type text null,
  customer_id uuid null,
  inquiry_message_enc bytea null,
  display_id character varying(20) null,
  updated_at timestamp with time zone not null default now(),
  session_id uuid null,
  constraint inquiries_pkey primary key (inquiry_id),
  constraint inquiries_display_id_key unique (display_id),
  constraint fk_inquiries_customer foreign KEY (customer_id) references customer (customer_id) on delete CASCADE,
  constraint inquiries_session_id_fkey foreign KEY (session_id) references chat_sessions_v2 (session_id) on delete set null,
  constraint inquiry_status_check check (
    (
      inquiry_status = any (
        array[
          'new'::text,
          'resolved'::text,
          'closed'::text,
          'under_review'::text,
          'pending_customer_reply'::text,
          'pending_admin_reply'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_inquiries_display_id on public.inquiries using btree (display_id) TABLESPACE pg_default;

create index IF not exists idx_inquiries_updated_at on public.inquiries using btree (updated_at) TABLESPACE pg_default;

create index IF not exists idx_inquiries_session_id on public.inquiries using btree (session_id) TABLESPACE pg_default;

create trigger set_ticket_display_id BEFORE INSERT on inquiries for EACH row
execute FUNCTION generate_ticket_display_id ();

create trigger trigger_ticket_notifications
after INSERT
or
update on inquiries for EACH row
execute FUNCTION notify_ticket_events ();

create trigger update_inquiries_updated_at BEFORE
update on inquiries for EACH row
execute FUNCTION update_inquiries_updated_at_column ();