create table public.chat_flows (
  flow_id text not null,
  title text not null,
  active boolean not null default true,
  constraint chat_flows_pkey primary key (flow_id)
) TABLESPACE pg_default;

-- sample table data:
INSERT INTO "public"."chat_flows" ("flow_id", "title", "active") VALUES ('about', 'About Us', 'true'), ('admin-single-ticket', 'Admin Ticket Management', 'true'), ('customer-track-ticket', 'Track a Ticket', 'true'), ('issue-ticket', 'Issue a Ticket', 'true'), ('shared', 'Shared Nodes', 'true');