-- Track Ticket Flow
-- Based on src/chatLogic/customer/flows/TrackTicket.ts

-- Flow definition
insert into public.chat_flows (flow_id, title, active)
values ('customer-track-ticket', 'Track a Ticket', true)
on conflict (flow_id) do update set title=excluded.title, active=excluded.active;

-- Nodes
insert into public.chat_flow_nodes (node_id, flow_id, node_type, text, is_initial, node_action, action_config)
values
  -- Start node
  (
    'track_ticket_start',
    'customer-track-ticket',
    'start',
    'Hi! I''m Printy. I can help you track your support ticket. Do you have your ticket number?',
    true,
    'none',
    '{}'
  ),
  
  -- Has ticket number - expects input for ticket ID
  (
    'has_ticket_number',
    'customer-track-ticket',
    'message',
    'Please enter your ticket number:',
    false,
    'validate_ticket_id',
    '{"next_on_valid":"display_ticket_details","error_message":"Invalid ticket number. Please try again."}'
  ),
  
  -- No ticket number - fetch customer's tickets
  (
    'no_ticket_number',
    'customer-track-ticket',
    'message',
    'I will display your submitted tickets. Please select or enter the ticket number you want to track.',
    false,
    'fetch_customer_tickets',
    '{"limit":10,"prompt":"Here are your submitted tickets:"}'
  ),
  
  -- Display ticket details
  (
    'display_ticket_details',
    'customer-track-ticket',
    'message',
    'Here are the details of your ticket:',
    false,
    'display_ticket_details',
    '{}'
  ),
  
  -- View ticket conversation
  (
    'view_ticket_conversation',
    'customer-track-ticket',
    'message',
    'Here is your ticket conversation:',
    false,
    'load_conversation_history',
    '{}'
  ),
  
  -- Reply to ticket
  (
    'reply_to_ticket',
    'customer-track-ticket',
    'message',
    'Type your message to reply to this ticket:',
    false,
    'send_ticket_reply',
    '{"success_message":"Your reply has been sent!"}'
  )
on conflict (node_id) do update set
  flow_id=excluded.flow_id,
  node_type=excluded.node_type,
  text=excluded.text,
  is_initial=excluded.is_initial,
  node_action=excluded.node_action,
  action_config=excluded.action_config;

-- Options (transitions)
insert into public.chat_flow_options (flow_id, from_node_id, label, to_node_id, sort_order)
values
  -- From track_ticket_start
  ('customer-track-ticket', 'track_ticket_start', 'Yes, I have a ticket number', 'has_ticket_number', 0),
  ('customer-track-ticket', 'track_ticket_start', 'No, I need to find my ticket', 'no_ticket_number', 1),
  ('customer-track-ticket', 'track_ticket_start', 'End Chat', 'end', 2),
  
  -- From has_ticket_number (after validation success)
  ('customer-track-ticket', 'has_ticket_number', 'View conversation', 'view_ticket_conversation', 0),
  ('customer-track-ticket', 'has_ticket_number', 'End Chat', 'end', 1),
  
  -- From no_ticket_number (after displaying list)
  ('customer-track-ticket', 'no_ticket_number', 'Back', 'track_ticket_start', 0),
  ('customer-track-ticket', 'no_ticket_number', 'End Chat', 'end', 1),
  
  -- From display_ticket_details
  ('customer-track-ticket', 'display_ticket_details', 'View conversation', 'view_ticket_conversation', 0),
  ('customer-track-ticket', 'display_ticket_details', 'End Chat', 'end', 1),
  
  -- From view_ticket_conversation
  ('customer-track-ticket', 'view_ticket_conversation', 'Reply to ticket', 'reply_to_ticket', 0),
  ('customer-track-ticket', 'view_ticket_conversation', 'End Chat', 'end', 1),
  
  -- From reply_to_ticket
  ('customer-track-ticket', 'reply_to_ticket', 'Send another message', 'reply_to_ticket', 0),
  ('customer-track-ticket', 'reply_to_ticket', 'End Chat', 'end', 1)
on conflict do nothing;

