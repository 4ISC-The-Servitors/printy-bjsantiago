{
  "nodes": {
    "end": {
      "type": "end",
      "message": "Thanks for using Printy! Have a great day!"
    },
    "greet": {
      "next": "show_proposal_details",
      "type": "message",
      "message": "Hi! I'm Printy, your bot assistant. The customer has accepted the quote proposal. Let's create an order!"
    },
    "create_order": {
      "next": "end",
      "type": "action",
      "action": "create_order",
      "action_config": {
        "conversation_id_key": "session_id"
      }
    },
    "show_options": {
      "type": "message",
      "message": "What would you like to do?",
      "options": [
        {
          "next": "create_order",
          "label": "Create Order",
          "value": "create_order"
        },
        {
          "next": "end",
          "label": "End Chat",
          "value": "end_chat"
        }
      ]
    },
    "show_quote_price": {
      "next": "show_options",
      "type": "action",
      "action": "display_quote_price",
      "action_config": {
        "conversation_id_key": "session_id"
      }
    },
    "check_quote_status": {
      "next": "conditional_status",
      "type": "action",
      "action": "check_accepted_quote",
      "action_config": {
        "conversation_id_key": "session_id"
      }
    },
    "conditional_status": {
      "type": "conditional",
      "cases": {
        "accepted": "greet",
        "not_accepted": "error_not_accepted"
      },
      "condition": "quote_status"
    },
    "error_not_accepted": {
      "next": "end",
      "type": "message",
      "message": "This quote has not been accepted by the customer yet."
    },
    "show_proposal_details": {
      "next": "show_quote_images",
      "type": "action",
      "action": "display_accepted_proposal",
      "action_config": {
        "conversation_id_key": "session_id"
      }
    }
    ,
    "show_quote_images": {
      "next": "show_quote_price",
      "type": "action",
      "action": "display_order_uploads_admin",
      "action_config": {
        "conversation_id_key": "session_id"
      }
    }
  },
  "title": "Admin: Create Order",
  "description": "Admin creates an order from an accepted quote proposal",
  "initial_node": "check_quote_status"
}