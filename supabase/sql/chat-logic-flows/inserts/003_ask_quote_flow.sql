-- Migration: Ask Quote Flow (DB-backed)
-- This migrates the ask-quote flow from scripted TypeScript to database-backed
-- with dual persistence in both chat_messages and quote_messages

-- Flow definition
INSERT INTO public.chat_flows (flow_id, title, active)
VALUES ('ask-quote', 'Ask Quote', true)
ON CONFLICT (flow_id) DO UPDATE SET 
  title = EXCLUDED.title, 
  active = EXCLUDED.active;

-- Node 1: Initial greeting with detailed instructions
-- This node expects user input and automatically transitions to create_quote_node
INSERT INTO public.chat_flow_nodes (node_id, flow_id, node_type, text, is_initial, node_action, action_config)
VALUES (
  'ask_quote_intro',
  'ask-quote',
  'start',
  'Hi! I''m Printy. Let''s start by understanding what you''d like to print!

Please describe the product you want printed in detail. For example:

• What type of item (business cards, flyers, banners, etc.)
• Size and dimensions
• Quantity needed
• Any specific materials or finishing requirements
• Your preferred deadline

Feel free to share any other details that might be important!',
  true,
  'expects_input',
  '{"input_key": "quote_details", "append": false, "auto_transition": "create_quote_node"}'::jsonb
)
ON CONFLICT (node_id) DO UPDATE SET
  flow_id = EXCLUDED.flow_id,
  node_type = EXCLUDED.node_type,
  text = EXCLUDED.text,
  is_initial = EXCLUDED.is_initial,
  node_action = EXCLUDED.node_action,
  action_config = EXCLUDED.action_config;

-- Node 2: Create quote conversation
INSERT INTO public.chat_flow_nodes (node_id, flow_id, node_type, text, is_initial, node_action, action_config)
VALUES (
  'create_quote_node',
  'ask-quote',
  'message',
  'Processing your quote request...',
  false,
  'create_quote_conversation',
  '{"details_key": "quote_details", "show_display_id": true}'::jsonb
)
ON CONFLICT (node_id) DO UPDATE SET
  flow_id = EXCLUDED.flow_id,
  node_type = EXCLUDED.node_type,
  text = EXCLUDED.text,
  is_initial = EXCLUDED.is_initial,
  node_action = EXCLUDED.node_action,
  action_config = EXCLUDED.action_config;

-- Options/Transitions
-- No quick replies from intro node - it expects free text input
-- Only show "End Chat" after quote is created
INSERT INTO public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order)
VALUES
  ('ask-quote', 'create_quote_node', 'End Chat', 'end', 0)
ON CONFLICT DO NOTHING;

