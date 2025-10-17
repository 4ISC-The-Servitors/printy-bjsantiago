-- Rebuild Issue Ticket Flow
-- This migration recreates the issue-ticket flow with proper node actions and configurations
-- that align with the chatFlowApi.ts patterns to avoid message duplication

-- First, clean up any existing nodes and options for the issue-ticket flow
DELETE FROM public.chat_flow_options WHERE flow_id = 'issue-ticket';
DELETE FROM public.chat_flow_nodes WHERE flow_id = 'issue-ticket';

-- Insert the flow nodes with proper actions and configurations
INSERT INTO public.chat_flow_nodes (node_id, flow_id, node_type, text, is_initial, node_action, action_config) VALUES
  -- Initial node
  ('issue_ticket_intro', 'issue-ticket', 'start', 'Hi! I''m Printy. Before we start, do you already have your order number?', true, 'none', '{}'::jsonb),
  
  -- Main flow nodes
  ('issue_ticket_start', 'issue-ticket', 'message', 'Hi! I''m Printy. I''ll help you create a support ticket. What''s your order number?', false, 'lookup_order', '{"input_sanitizer":"alnumdash","order_id_context_key":"order_id","next_on_found":"order_issue_menu","error_message":"Please enter a valid order number."}'::jsonb),
  
  ('no_order_number', 'issue-ticket', 'message', 'No problem! I can still help you create a ticket. What issue are you experiencing?', false, 'list_recent_orders', '{"limit":10,"prompt":"Here are your recent orders:\n\nPlease type or click the order number you have an issue with."}'::jsonb),
  
  ('order_issue_menu', 'issue-ticket', 'message', 'What issue are you experiencing with this order? Choose one so I can create a ticket.', false, 'none', '{}'::jsonb),
  
  -- Issue type nodes
  ('quality_issue', 'issue-ticket', 'message', 'Please describe the issue in detail so I can create the right ticket.', false, 'expects_input', '{"input_key":"details","append":true,"set_on_enter":{"inquiry_type":"quality"}}'::jsonb),
  
  ('delivery_issue', 'issue-ticket', 'message', 'Please provide details about what happened.', false, 'expects_input', '{"input_key":"details","append":true,"set_on_enter":{"inquiry_type":"delivery"}}'::jsonb),
  
  ('billing_issue', 'issue-ticket', 'message', 'Please describe the issue you''re experiencing.', false, 'expects_input', '{"input_key":"details","append":true,"set_on_enter":{"inquiry_type":"billing"}}'::jsonb),
  
  ('other_issue', 'issue-ticket', 'message', 'Please describe the issue.', false, 'expects_input', '{"input_key":"details","append":true,"set_on_enter":{"inquiry_type":"other"}}'::jsonb),
  
  -- Submission node
  ('submit_ticket', 'issue-ticket', 'message', 'Thank you for providing the details. I''ll create a ticket for you.', false, 'create_inquiry', '{"details_key":"details","type_key":"inquiry_type","success_message":"Ticket submitted successfully!","show_inquiry_id":true}'::jsonb);

-- Insert flow options (quick replies)
INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order) VALUES
  -- From intro node
  ('issue-ticket', 'issue_ticket_intro', 'Yes, I have it', 'issue_ticket_start', 0),
  ('issue-ticket', 'issue_ticket_intro', 'I don''t have it', 'no_order_number', 1),
  ('issue-ticket', 'issue_ticket_intro', 'End Chat', 'end', 2),
  
  -- From issue_ticket_start (no options - expects free text input)
  
  -- From no_order_number (no options - shows recent orders dynamically)
  
  -- From order_issue_menu
  ('issue-ticket', 'order_issue_menu', 'Printing quality issue', 'quality_issue', 0),
  ('issue-ticket', 'order_issue_menu', 'Delivery problem', 'delivery_issue', 1),
  ('issue-ticket', 'order_issue_menu', 'Billing question', 'billing_issue', 2),
  ('issue-ticket', 'order_issue_menu', 'Other concern', 'other_issue', 3),
  ('issue-ticket', 'order_issue_menu', 'End Chat', 'end', 4),
  
  -- From issue detail nodes
  ('issue-ticket', 'quality_issue', 'Submit ticket', 'submit_ticket', 0),
  ('issue-ticket', 'quality_issue', 'End Chat', 'end', 1),
  ('issue-ticket', 'delivery_issue', 'Submit ticket', 'submit_ticket', 0),
  ('issue-ticket', 'delivery_issue', 'End Chat', 'end', 1),
  ('issue-ticket', 'billing_issue', 'Submit ticket', 'submit_ticket', 0),
  ('issue-ticket', 'billing_issue', 'End Chat', 'end', 1),
  ('issue-ticket', 'other_issue', 'Submit ticket', 'submit_ticket', 0),
  ('issue-ticket', 'other_issue', 'End Chat', 'end', 1);

-- Note: The flow references the shared 'end' node from flow_id = 'shared'
-- This prevents duplication of the "Thank you for chatting with Printy! Have a great day." message

-- Key improvements over the original 014_seed_flow_issue_ticket.sql:
-- 1. Proper node_action configurations that align with chatFlowApi.ts patterns
-- 2. Uses shared 'end' node to prevent message duplication
-- 3. Dynamic message handling through node_id references
-- 4. Proper action_config JSON structures for each node type
-- 5. Clean separation between static flow messages and dynamic user content
