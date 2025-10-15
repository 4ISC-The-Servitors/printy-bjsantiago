create table public.chat_session_flow (
  session_id uuid not null,
  flow_id text not null,
  current_node_id text not null,
  started_at timestamp with time zone not null default now(),
  ended_at timestamp with time zone null,
  context jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone not null default now(),
  constraint chat_session_flow_pkey primary key (session_id),
  constraint chat_session_flow_current_node_id_fkey foreign KEY (current_node_id) references chat_flow_nodes (node_id) on delete RESTRICT,
  constraint chat_session_flow_flow_id_fkey foreign KEY (flow_id) references chat_flows (flow_id) on delete RESTRICT,
  constraint chat_session_flow_session_id_fkey foreign KEY (session_id) references chat_sessions (session_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_chat_session_flow_flow on public.chat_session_flow using btree (flow_id) TABLESPACE pg_default;

-- sample table data:
insert into public.chat_session_flow (
  session_id, flow_id, current_node_id, started_at, ended_at, context, updated_at
) values
  ('dcb18718-193c-4c03-9797-958d9ad723e9','about','contact_us','2025-09-30 19:36:13.144968+00','2025-09-30 19:36:20.96+00','{}','2025-09-30 19:36:13.144968+00'),
  ('dcc94685-71cf-40a7-ad02-638af2d32b25','about','about_us_start','2025-10-13 10:29:12.472525+00','2025-10-13 10:29:17.339+00','{}','2025-10-13 10:29:12.472525+00'),
  ('007fb093-77de-44ee-8bd7-5865aa86f051','issue-ticket','issue_ticket_start','2025-10-14 06:40:27.824789+00',null,'{}','2025-10-14 06:40:27.824789+00'),
  ('09f435d6-b64b-4aff-9029-ea7144c56c98','issue-ticket','issue_ticket_intro','2025-10-13 14:02:54.826199+00',null,'{}','2025-10-13 14:02:54.826199+00'),
  ('0e182eae-feee-4c0d-b2fe-a024b46775c6','issue-ticket','issue_ticket_intro','2025-10-13 14:02:43.189846+00',null,'{}','2025-10-13 14:02:43.189846+00'),
  ('0fe2a4bf-7cd4-4e23-9cae-db3858179c20','issue-ticket','issue_ticket_intro','2025-10-13 11:25:12.575619+00','2025-10-13 11:25:17.706+00','{}','2025-10-13 11:25:12.575619+00'),
  ('1198ebab-f70a-4b33-9692-bcf6c7861a49','issue-ticket','no_order_number','2025-10-13 15:11:41.084407+00',null,'{}','2025-10-13 15:11:41.084407+00'),
  ('11cdd1c1-6110-496d-b94b-b1e462089e22','issue-ticket','submit_ticket','2025-10-14 00:59:18.5031+00','2025-10-14 00:59:58.969+00','{"order_id":"ORD-MGPUP61AJY9EZMV"}','2025-10-14 00:59:53.532+00'),
  ('1ab00f24-7399-43ce-856d-ceb75c79c576','issue-ticket','issue_ticket_start','2025-10-13 15:11:54.134657+00','2025-10-13 15:12:03.87+00','{}','2025-10-13 15:11:54.134657+00'),
  ('1fc0323a-f78a-4fd2-9684-0787e80ccd22','issue-ticket','submit_ticket','2025-10-11 16:49:56.753433+00','2025-10-11 16:50:24.175+00','{"order_id":"f1e1dcbe-9a5c-4214-965e-8296d1a501a2"}','2025-10-11 16:50:19.322+00');