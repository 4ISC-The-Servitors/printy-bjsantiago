create table public.chat_flow_nodes (
  node_id text not null,
  flow_id text not null,
  node_type text not null,
  text text not null,
  is_initial boolean not null default false,
  node_action text null default 'none'::text,
  action_config jsonb not null default '{}'::jsonb,
  constraint chat_flow_nodes_pkey primary key (node_id),
  constraint chat_flow_nodes_flow_id_fkey foreign KEY (flow_id) references chat_flows (flow_id) on delete CASCADE,
  constraint chat_flow_nodes_node_action_check check (
    (
      node_action = any (
        array[
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
          'collect_feedback'::text
        ]
      )
    )
  ),
  constraint chat_flow_nodes_node_type_check check (
    (
      node_type = any (
        array['start'::text, 'message'::text, 'end'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_chat_flow_nodes_flow on public.chat_flow_nodes using btree (flow_id) TABLESPACE pg_default;

-- sample table data:
insert into public.chat_flow_nodes (
  node_id, flow_id, node_type, text, is_initial, node_action, action_config
) values
  (
    'billing_issue',
    'issue-ticket',
    'message',
    'Please describe the issue you''re experiencing.',
    false,
    'expects_input',
    '{"append":true,"input_key":"details","set_on_enter":{"inquiry_type":"billing"}}'
  ),
  (
    'delivery_issue',
    'issue-ticket',
    'message',
    'Please provide details about what happened.',
    false,
    'expects_input',
    '{"append":true,"input_key":"details","set_on_enter":{"inquiry_type":"delivery"}}'
  ),
  (
    'issue_ticket_intro',
    'issue-ticket',
    'start',
    'Hi! I''m Printy. Before we start, do you already have your order number?',
    true,
    'none',
    '{}'
  ),
  (
    'issue_ticket_start',
    'issue-ticket',
    'message',
    'Hi! I''m Printy. I''ll help you create a support ticket. What''s your order number?',
    false,
    'lookup_order',
    '{"error_message":"Please enter a valid order number.","next_on_found":"order_issue_menu","input_sanitizer":"alnumdash","order_id_context_key":"order_id"}'
  ),
  (
    'no_order_number',
    'issue-ticket',
    'message',
    'No problem! I can still help you create a ticket. What issue are you experiencing?',
    false,
    'list_recent_orders',
    '{"limit":10,"prompt":"Here are your recent orders:\n\nPlease type or click the order number you have an issue with."}'
  ),
  (
    'order_issue_menu',
    'issue-ticket',
    'message',
    'What issue are you experiencing with this order? Choose one so I can create a ticket.',
    false,
    'none',
    '{}'
  ),
  (
    'other_issue',
    'issue-ticket',
    'message',
    'Please describe the issue.',
    false,
    'expects_input',
    '{"append":true,"input_key":"details","set_on_enter":{"inquiry_type":"other"}}'
  ),
  (
    'quality_issue',
    'issue-ticket',
    'message',
    'Please describe the issue in detail so I can create the right ticket.',
    false,
    'expects_input',
    '{"append":true,"input_key":"details","set_on_enter":{"inquiry_type":"quality"}}'
  ),
  (
    'submit_ticket',
    'issue-ticket',
    'message',
    'Thank you for providing the details. I''ll create a ticket for you.',
    false,
    'create_inquiry',
    '{"type_key":"inquiry_type","details_key":"details","show_inquiry_id":true,"success_message":"Ticket submitted successfully!"}'
  ),
  (
    'end',
    'shared',
    'end',
    'Thank you for chatting with Printy! Have a great day.',
    false,
    'none',
    '{}'
  );