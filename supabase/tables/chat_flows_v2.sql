create table public.chat_flows_v2 (
  flow_id text not null,
  flow_definition jsonb not null,
  active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  flow_owner text null default 'customer'::text,
  constraint chat_flows_v2_pkey primary key (flow_id),
  constraint chat_flows_v2_flow_owner_check check (
    (
      flow_owner = any (
        array['customer'::text, 'admin'::text, 'guest'::text]
      )
    )
  )
) TABLESPACE pg_default;

create trigger set_timestamp_chat_flows_v2 BEFORE
update on chat_flows_v2 for EACH row
execute FUNCTION trigger_set_timestamp ();