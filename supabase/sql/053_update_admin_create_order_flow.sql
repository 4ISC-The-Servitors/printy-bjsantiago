-- Update admin-create-order flow to include conditional logic
UPDATE chat_flows_v2 
SET flow_definition = '{
  "title": "Admin: Create Order",
  "description": "Admin creates an order from an accepted quote proposal",
  "initial_node": "check_quote_status",
  "nodes": {
    "check_quote_status": {
      "type": "action",
      "action": "check_accepted_quote",
      "action_config": {
        "conversation_id_key": "session_id"
      },
      "next": "conditional_status"
    },
    "conditional_status": {
      "type": "conditional",
      "condition": "quote_status",
      "cases": {
        "accepted": "greet",
        "not_accepted": "error_not_accepted"
      }
    },
    "greet": {
      "type": "message",
      "message": "Hi! I''m Printy, your bot assistant. The customer has accepted the quote proposal. Let''s create an order!",
      "next": "show_proposal_details"
    },
    "show_proposal_details": {
      "type": "action",
      "action": "display_accepted_proposal",
      "action_config": {
        "conversation_id_key": "session_id"
      },
      "next": "show_quote_price"
    },
    "show_quote_price": {
      "type": "action",
      "action": "display_quote_price",
      "action_config": {
        "conversation_id_key": "session_id"
      },
      "next": "show_options"
    },
    "show_options": {
      "type": "message",
      "message": "What would you like to do?",
      "options": [
        {
          "label": "Create Order",
          "value": "create_order",
          "next": "create_order"
        },
        {
          "label": "End Chat",
          "value": "end_chat",
          "next": "end"
        }
      ]
    },
    "create_order": {
      "type": "action",
      "action": "create_order",
      "action_config": {
        "conversation_id_key": "session_id"
      },
      "next": "end"
    },
    "error_not_accepted": {
      "type": "message",
      "message": "This quote has not been accepted by the customer yet. You cannot create an order from a non-accepted quote.",
      "next": "end"
    },
    "end": {
      "type": "end",
      "message": "Thanks for using Printy! Have a great day!"
    }
  }
}'::jsonb
WHERE flow_id = 'admin-create-order';
