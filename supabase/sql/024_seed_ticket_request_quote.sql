-- Seed: add "Request Product Quote" entry to Issue Ticket flow

-- Node to accept free-text for quote
insert into public.chat_flow_nodes (node_id, flow_id, node_type, text, is_initial, node_action, action_config)
values (
  'request_quote_start','issue-ticket','message',
  'Sure — tell me about the product you want quoted.',
  false,
  'expects_input',
  '{"input_key":"quote_notes","append":true}'::jsonb
)
on conflict (node_id) do nothing;

-- Quick reply on intro node
insert into public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order)
values ('issue-ticket','issue_ticket_intro','Request Product Quote','request_quote_start',3)
on conflict do nothing;



