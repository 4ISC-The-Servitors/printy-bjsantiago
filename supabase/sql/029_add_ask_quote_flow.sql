-- Migration 029: Add ask-quote flow to chat_flows table
-- This allows the ask-quote flow to be tracked in the database

-- Add the ask-quote flow to chat_flows table
INSERT INTO chat_flows (flow_id, title, active) 
VALUES ('ask-quote', 'Ask Quote', true)
ON CONFLICT (flow_id) DO UPDATE SET 
  title = EXCLUDED.title,
  active = EXCLUDED.active;

-- Add initial node for ask-quote flow
INSERT INTO chat_flow_nodes (node_id, flow_id, node_type, text, is_initial, node_action, action_config)
VALUES (
  'ask_quote_start',
  'ask-quote',
  'start',
  'Hello! I''m here to help you get a quote for your printing needs. Please tell me what you''re looking for - what type of product, quantity, size, materials, or any other specifications you have in mind.',
  true,
  'expects_input',
  '{"free_text": true, "creates_inquiry": true}'::jsonb
)
ON CONFLICT (node_id) DO UPDATE SET
  text = EXCLUDED.text,
  node_action = EXCLUDED.node_action,
  action_config = EXCLUDED.action_config;

-- Add an end node for the flow
INSERT INTO chat_flow_nodes (node_id, flow_id, node_type, text, is_initial, node_action, action_config)
VALUES (
  'ask_quote_end',
  'ask-quote',
  'end',
  'Thank you for your quote request! I''ve noted down your requirements. Our team will review this and get back to you with a detailed quote soon.',
  false,
  'none',
  '{}'::jsonb
)
ON CONFLICT (node_id) DO UPDATE SET
  text = EXCLUDED.text;

-- Add a transition from start to end (this will be handled by the QuoteFlowDriver)
INSERT INTO chat_flow_options (flow_id, from_node_id, to_node_id, label, sort_order)
VALUES (
  'ask-quote',
  'ask_quote_start',
  'ask_quote_end',
  'End Quote Request',
  1
)
ON CONFLICT DO NOTHING;
