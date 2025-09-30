-- Ensure all flows point their "End Chat" options to the shared end node

-- 1) Ensure shared flow and end node exist
-- Prefer a dedicated shared flow for global nodes
INSERT INTO public.chat_flows (flow_id, title, active)
VALUES ('shared', 'Shared Nodes', true)
ON CONFLICT (flow_id) DO NOTHING;

INSERT INTO public.chat_flow_nodes (node_id, flow_id, node_type, text, is_initial)
VALUES ('end','shared','end','Thank you for chatting with Printy! Have a great day.', false)
ON CONFLICT (node_id) DO NOTHING;

-- 2) Helper: insert End Chat option if missing
-- Issue Ticket flow
INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order)
SELECT 'issue-ticket','issue_ticket_intro','End Chat','end',2
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_flow_options
  WHERE flow_id='issue-ticket' AND from_node_id='issue_ticket_intro' AND label='End Chat'
);

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order)
SELECT 'issue-ticket','order_issue_menu','End Chat','end',4
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_flow_options
  WHERE flow_id='issue-ticket' AND from_node_id='order_issue_menu' AND label='End Chat'
);

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order)
SELECT 'issue-ticket','no_order_number','End Chat','end',4
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_flow_options
  WHERE flow_id='issue-ticket' AND from_node_id='no_order_number' AND label='End Chat'
);

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order)
SELECT 'issue-ticket','quality_issue','End Chat','end',1
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_flow_options
  WHERE flow_id='issue-ticket' AND from_node_id='quality_issue' AND label='End Chat'
);

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order)
SELECT 'issue-ticket','delivery_issue','End Chat','end',1
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_flow_options
  WHERE flow_id='issue-ticket' AND from_node_id='delivery_issue' AND label='End Chat'
);

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order)
SELECT 'issue-ticket','billing_issue','End Chat','end',1
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_flow_options
  WHERE flow_id='issue-ticket' AND from_node_id='billing_issue' AND label='End Chat'
);

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order)
SELECT 'issue-ticket','other_issue','End Chat','end',1
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_flow_options
  WHERE flow_id='issue-ticket' AND from_node_id='other_issue' AND label='End Chat'
);

-- About flow (ensure End Chat exists as well)
INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order)
SELECT 'about','about_us_start','End Chat','end',2
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_flow_options
  WHERE flow_id='about' AND from_node_id='about_us_start' AND label='End Chat'
);

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order)
SELECT 'about','company_history','End Chat','end',1
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_flow_options
  WHERE flow_id='about' AND from_node_id='company_history' AND label='End Chat'
);

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order)
SELECT 'about','contact_us','End Chat','end',1
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_flow_options
  WHERE flow_id='about' AND from_node_id='contact_us' AND label='End Chat'
);


