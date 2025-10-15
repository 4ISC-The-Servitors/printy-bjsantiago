-- Seed data for Issue Ticket flow

-- Flow
INSERT INTO public.chat_flows (flow_id, title, active)
VALUES ('issue-ticket', 'Issue a Ticket', true)
ON CONFLICT (flow_id) DO UPDATE SET title = EXCLUDED.title, active = EXCLUDED.active;

-- Nodes
INSERT INTO public.chat_flow_nodes (node_id, flow_id, node_type, text, is_initial) VALUES
  ('issue_ticket_intro','issue-ticket','start','Hi! I''m Printy. Before we start, do you already have your order number?', true)
ON CONFLICT (node_id) DO NOTHING;

INSERT INTO public.chat_flow_nodes (node_id, flow_id, node_type, text, is_initial) VALUES
  ('issue_ticket_start','issue-ticket','message','Hi! I''m Printy. I''ll help you create a support ticket. What''s your order number?', false),
  ('ticket_status_start','issue-ticket','message','Ticket Status Inquiry\nPlease enter your ticket number to check its status.', false),
  ('order_issue_menu','issue-ticket','message','What issue are you experiencing with this order? Choose one so I can create a ticket.', false),
  ('no_order_number','issue-ticket','message','No problem! I can still help you create a ticket. What issue are you experiencing?', false),
  ('quality_issue','issue-ticket','message','Printing Quality Issue\nPlease describe the issue in detail so I can create the right ticket.', false),
  ('delivery_issue','issue-ticket','message','Delivery Problem\nPlease provide details about what happened.', false),
  ('billing_issue','issue-ticket','message','Billing Question\nPlease describe the issue you''re experiencing.', false),
  ('other_issue','issue-ticket','message','Other Concern\nPlease describe the issue.', false),
  ('submit_ticket','issue-ticket','message','Thank you for providing the details. I''ll create a ticket for you.', false)
ON CONFLICT (node_id) DO NOTHING;

-- Note: We intentionally do NOT insert an 'end' node for this flow.
-- The global 'end' node is shared (e.g., in flow_id = 'about') and is referenced by options below.

-- Options (quick replies)
INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order) VALUES
  ('issue-ticket','issue_ticket_intro','Yes, I have it','issue_ticket_start',0),
  ('issue-ticket','issue_ticket_intro','I don''t have it','no_order_number',1),
  ('issue-ticket','issue_ticket_intro','End Chat','end',2)
ON CONFLICT DO NOTHING;

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order) VALUES
  ('issue-ticket','issue_ticket_start','End Chat','end',0)
ON CONFLICT DO NOTHING;

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order) VALUES
  ('issue-ticket','order_issue_menu','Printing quality issue','quality_issue',0),
  ('issue-ticket','order_issue_menu','Delivery problem','delivery_issue',1),
  ('issue-ticket','order_issue_menu','Billing question','billing_issue',2),
  ('issue-ticket','order_issue_menu','Other concern','other_issue',3),
  ('issue-ticket','order_issue_menu','End Chat','end',4)
ON CONFLICT DO NOTHING;

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order) VALUES
  ('issue-ticket','no_order_number','Printing quality issue','quality_issue',0),
  ('issue-ticket','no_order_number','Delivery problem','delivery_issue',1),
  ('issue-ticket','no_order_number','Billing question','billing_issue',2),
  ('issue-ticket','no_order_number','Other concern','other_issue',3),
  ('issue-ticket','no_order_number','End Chat','end',4)
ON CONFLICT DO NOTHING;

INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order) VALUES
  ('issue-ticket','quality_issue','Submit ticket','submit_ticket',0),
  ('issue-ticket','quality_issue','End Chat','end',1),
  ('issue-ticket','delivery_issue','Submit ticket','submit_ticket',0),
  ('issue-ticket','delivery_issue','End Chat','end',1),
  ('issue-ticket','billing_issue','Submit ticket','submit_ticket',0),
  ('issue-ticket','billing_issue','End Chat','end',1),
  ('issue-ticket','other_issue','Submit ticket','submit_ticket',0),
  ('issue-ticket','other_issue','End Chat','end',1)
ON CONFLICT DO NOTHING;

-- Node actions (now stored on chat_flow_nodes)
-- issue_ticket_start: expects free-text order number + lookup order
UPDATE public.chat_flow_nodes
SET node_action = 'lookup_order',
    action_config = '{"input_sanitizer":"alnumdash","order_id_context_key":"order_id","next_on_found":"order_issue_menu","error_message":"Please enter a valid order number."}'::jsonb
WHERE node_id = 'issue_ticket_start' AND flow_id = 'issue-ticket';

-- ticket_status_start: expects free-text ticket ID and returns status
UPDATE public.chat_flow_nodes
SET node_action = 'ticket_status_query',
    action_config = '{"input_sanitizer":"alnumdash","error_message":"Please enter a valid ticket number (inquiry ID)."}'::jsonb
WHERE node_id = 'ticket_status_start' AND flow_id = 'issue-ticket';

-- no_order_number: immediately list recent orders and quick replies with order ids
UPDATE public.chat_flow_nodes
SET node_action = 'list_recent_orders',
    action_config = '{"limit":10,"prompt":"Here are your recent orders:\n\nPlease type or click the order number you have an issue with."}'::jsonb
WHERE node_id = 'no_order_number' AND flow_id = 'issue-ticket';

-- Detail nodes: capture free text as appended notes and set inquiry_type (via set_on_enter)
UPDATE public.chat_flow_nodes
SET node_action = 'expects_input',
    action_config = '{"input_key":"details","append":true,"set_on_enter":{"inquiry_type":"quality"}}'::jsonb
WHERE node_id = 'quality_issue' AND flow_id = 'issue-ticket';

UPDATE public.chat_flow_nodes
SET node_action = 'expects_input',
    action_config = '{"input_key":"details","append":true,"set_on_enter":{"inquiry_type":"delivery"}}'::jsonb
WHERE node_id = 'delivery_issue' AND flow_id = 'issue-ticket';

UPDATE public.chat_flow_nodes
SET node_action = 'expects_input',
    action_config = '{"input_key":"details","append":true,"set_on_enter":{"inquiry_type":"billing"}}'::jsonb
WHERE node_id = 'billing_issue' AND flow_id = 'issue-ticket';

UPDATE public.chat_flow_nodes
SET node_action = 'expects_input',
    action_config = '{"input_key":"details","append":true,"set_on_enter":{"inquiry_type":"other"}}'::jsonb
WHERE node_id = 'other_issue' AND flow_id = 'issue-ticket';

-- submit_ticket: create inquiry using context
UPDATE public.chat_flow_nodes
SET node_action = 'create_inquiry',
    action_config = '{"details_key":"details","type_key":"inquiry_type","success_message":"Ticket submitted successfully!","show_inquiry_id":true}'::jsonb
WHERE node_id = 'submit_ticket' AND flow_id = 'issue-ticket';


