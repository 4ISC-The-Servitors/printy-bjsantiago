create table public.chat_flow_options (
  option_id uuid not null default gen_random_uuid (),
  flow_id text not null,
  from_node_id text not null,
  label text not null,
  to_node_id text not null,
  sort_order integer not null default 0,
  constraint chat_flow_options_pkey primary key (option_id),
  constraint chat_flow_options_flow_id_fkey foreign KEY (flow_id) references chat_flows (flow_id) on delete CASCADE,
  constraint chat_flow_options_from_node_id_fkey foreign KEY (from_node_id) references chat_flow_nodes (node_id) on delete CASCADE,
  constraint chat_flow_options_to_node_id_fkey foreign KEY (to_node_id) references chat_flow_nodes (node_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_chat_flow_options_from on public.chat_flow_options using btree (from_node_id) TABLESPACE pg_default;

create index IF not exists idx_chat_flow_options_flow on public.chat_flow_options using btree (flow_id) TABLESPACE pg_default;

-- sample table data:
-- inserts moved to inserts/001_ask_assistance_flow.sql
  ('02fe0374-56c5-4ac9-99fe-ca4cbf271e1d', 'issue-ticket', 'issue_ticket_intro', 'End Chat', 'end', 2),
  ('03eddd7b-7fb5-4ddb-9fcf-ee3fe6789d3f', 'issue-ticket', 'order_issue_menu', 'Other concern', 'other_issue', 3),
  ('0cea1f73-e9c3-4b10-9735-d7cd0d346e03', 'issue-ticket', 'order_issue_menu', 'End Chat', 'end', 4),
  ('4c639e62-6ae1-431c-a0c7-0f88dad60872', 'issue-ticket', 'other_issue', 'Submit ticket', 'submit_ticket', 0),
  ('4f48dd52-40b4-4525-8601-c003f491e3a6', 'issue-ticket', 'delivery_issue', 'Submit ticket', 'submit_ticket', 0),
  ('5460379e-fb0b-4783-8a40-98609618b281', 'issue-ticket', 'order_issue_menu', 'Delivery problem', 'delivery_issue', 1),
  ('58e02a36-9013-446e-afcd-b28912605e95', 'issue-ticket', 'delivery_issue', 'End Chat', 'end', 1),
  ('6428af74-4ed0-4410-b571-f568d85b97ef', 'issue-ticket', 'billing_issue', 'Submit ticket', 'submit_ticket', 0),
  ('78f753af-f524-4aad-9ac8-55a173758c59', 'issue-ticket', 'issue_ticket_intro', 'Yes, I have it', 'issue_ticket_start', 0),
  ('7eea345e-82e7-4939-b8eb-28c471b9823c', 'issue-ticket', 'quality_issue', 'Submit ticket', 'submit_ticket', 0),
  ('7f3f52fe-75d5-45b3-b585-8d2dd72be83f', 'issue-ticket', 'other_issue', 'End Chat', 'end', 1),
  ('8e6c6857-be67-437d-9baa-960a0c3614c5', 'issue-ticket', 'billing_issue', 'End Chat', 'end', 1),
  ('b5de752c-0715-4b9a-8a08-a9824b1d7868', 'issue-ticket', 'order_issue_menu', 'Billing question', 'billing_issue', 2),
  ('ea2fc997-2c9d-4676-8aab-7ee46260c614', 'issue-ticket', 'issue_ticket_intro', 'I don''t have it', 'no_order_number', 1),
  ('ea662ba7-f6ef-4b6f-9dd9-328f3d3e52be', 'issue-ticket', 'quality_issue', 'End Chat', 'end', 1),
  ('fa67e5fd-9c13-4699-8bcf-6921d2c73b0b', 'issue-ticket', 'order_issue_menu', 'Printing quality issue', 'quality_issue', 0);