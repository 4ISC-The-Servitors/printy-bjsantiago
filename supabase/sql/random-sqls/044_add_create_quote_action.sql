-- Migration 044: Add 'create_quote_conversation' node action
-- This enables chat flows to create quote conversations with dual persistence

-- Add new node action to the constraint
ALTER TABLE chat_flow_nodes
  DROP CONSTRAINT IF EXISTS chat_flow_nodes_node_action_check;

ALTER TABLE chat_flow_nodes
  ADD CONSTRAINT chat_flow_nodes_node_action_check
  CHECK (
    node_action = ANY (ARRAY[
      -- Existing actions
      'none'::text,
      'expects_input'::text,
      'set_context'::text,
      'lookup_order'::text,
      'list_recent_orders'::text,
      'create_inquiry'::text,
      'ticket_status_query'::text,
      'fetch_customer_tickets'::text,
      'select_ticket'::text,
      'load_conversation_history'::text,
      'send_ticket_reply'::text,
      'reset_context'::text,
      'update_inquiry_status'::text,
      'collect_feedback'::text,
      'update_ticket_status'::text,
      'send_admin_reply'::text,
      'validate_ticket_id'::text,
      'display_ticket_details'::text,
      
      -- New action for quote flows
      'create_quote_conversation'::text
    ])
  );

