-- Seed Ask Assistance flow and its nodes/options

-- Flow
insert into public.chat_flows (flow_id, title, active)
values ('ask-assistance', 'Ask Assistance', true)
on conflict (flow_id) do update set title=excluded.title, active=excluded.active;

-- Nodes
insert into public.chat_flow_nodes (node_id, flow_id, node_type, text, is_initial, node_action, action_config)
values
  ('assist_intro', 'ask-assistance', 'start', 'Hi! I''m Printy. How can I assist you today?', true, 'none', '{}'),
  ('assist_issue_menu', 'ask-assistance', 'message', 'Choose the type of assistance you need.', false, 'none', '{}'),
  ('assist_issue_quality', 'ask-assistance', 'message', 'Please describe the printing quality issue.', false, 'expects_input', '{"append":true,"input_key":"details","set_on_enter":{"inquiry_type":"quality"}}'),
  ('assist_issue_delivery', 'ask-assistance', 'message', 'Please describe the delivery problem.', false, 'expects_input', '{"append":true,"input_key":"details","set_on_enter":{"inquiry_type":"delivery"}}'),
  ('assist_issue_billing', 'ask-assistance', 'message', 'Please describe your billing question.', false, 'expects_input', '{"append":true,"input_key":"details","set_on_enter":{"inquiry_type":"billing"}}'),
  ('assist_issue_other', 'ask-assistance', 'message', 'Please describe your concern.', false, 'expects_input', '{"append":true,"input_key":"details","set_on_enter":{"inquiry_type":"other"}}'),
  ('assist_submit_inquiry', 'ask-assistance', 'message', 'Thanks for the details. I''ll create a ticket for you.', false, 'create_inquiry', '{"type_key":"inquiry_type","details_key":"details","show_inquiry_id":true,"success_message":"Ticket submitted successfully!"}')
on conflict (node_id) do update set
  flow_id=excluded.flow_id,
  node_type=excluded.node_type,
  text=excluded.text,
  is_initial=excluded.is_initial,
  node_action=excluded.node_action,
  action_config=excluded.action_config;

-- Options
insert into public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order)
values
  ('ask-assistance', 'assist_intro', 'Get assistance', 'assist_issue_menu', 0),
  ('ask-assistance', 'assist_intro', 'End Chat', 'end', 1),
  ('ask-assistance', 'assist_issue_menu', 'Printing quality issue', 'assist_issue_quality', 0),
  ('ask-assistance', 'assist_issue_menu', 'Delivery problem', 'assist_issue_delivery', 1),
  ('ask-assistance', 'assist_issue_menu', 'Billing question', 'assist_issue_billing', 2),
  ('ask-assistance', 'assist_issue_menu', 'Other concern', 'assist_issue_other', 3),
  ('ask-assistance', 'assist_issue_quality', 'Submit ticket', 'assist_submit_inquiry', 0),
  ('ask-assistance', 'assist_issue_delivery', 'Submit ticket', 'assist_submit_inquiry', 0),
  ('ask-assistance', 'assist_issue_billing', 'Submit ticket', 'assist_submit_inquiry', 0),
  ('ask-assistance', 'assist_issue_other', 'Submit ticket', 'assist_submit_inquiry', 0)
on conflict do nothing;


