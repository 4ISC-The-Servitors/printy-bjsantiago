{
  "nodes": {
    "end": {
      "type": "end",
      "message": "Thanks for choosing B.J. Santiago! Have a great day!"
    },
    "intro": {
      "next": "show_original_request",
      "type": "message",
      "message": "Hi, I'm Printy, B.J. Santiago's bot assistant. Let me pull up your quote request details for you.",
      "expects_input": false
    },
    "accept_quote": {
      "type": "action",
      "action": "accept_quote_proposal",
      "action_config": {
        "conversation_id_key": "conversation_id"
      }
    },
    "reject_quote": {
      "type": "action",
      "action": "reject_quote_proposal",
      "action_config": {
        "conversation_id_key": "conversation_id"
      }
    },
    "show_quoted_price": {
      "next": "show_quote_decision_prompt",
      "type": "action",
      "action": "display_quoted_price",
      "action_config": {
        "conversation_id_key": "conversation_id"
      }
    },
    "show_proposal_specs": {
      "next": "show_quoted_price",
      "type": "action",
      "action": "display_proposal_specs",
      "action_config": {
        "conversation_id_key": "conversation_id"
      }
    },
    "show_quote_images": {
      "next": "show_proposal_specs",
      "type": "action",
      "action": "display_order_uploads",
      "action_config": {
        "conversation_id_key": "conversation_id"
      }
    },
    "show_original_request": {
      "next": "show_quote_images",
      "type": "action",
      "action": "display_original_request",
      "action_config": {
        "conversation_id_key": "conversation_id"
      }
    },
    "show_quote_decision_prompt": {
      "type": "action",
      "action": "show_quote_decision_prompt",
      "options": [
        {
          "next": "accept_quote",
          "label": "Accept Quote",
          "value": "Accept Quote"
        },
        {
          "next": "reject_quote",
          "label": "Reject Quote",
          "value": "Reject Quote"
        },
        {
          "next": "end",
          "label": "End Chat",
          "value": "End Chat"
        }
      ],
      "action_config": {
        "conversation_id_key": "conversation_id"
      }
    }
  },
  "initial_node": "intro"
}