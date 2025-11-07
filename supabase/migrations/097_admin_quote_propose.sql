{
  "nodes": {
    "end": {
      "type": "end",
      "message": "Thanks for using Printy! Have a great day!"
    },
    "greet": {
      "next": "show_details",
      "type": "message",
      "message": "Hi! I'm Printy, your bot assistant. Let's work on this quote request."
    },
    "send_specs": {
      "next": "end",
      "type": "action",
      "action": "send_quote_proposal",
      "action_config": {
        "conversation_id_key": "session_id"
      }
    },
    "manual_specs": {
      "next": "wait_for_draft_save",
      "type": "action",
      "action": "manual_order_specs",
      "action_config": {
        "conversation_id_key": "session_id"
      }
    },
    "show_details": {
      "next": "show_quote_images",
      "type": "action",
      "action": "display_quote_details_admin",
      "action_config": {
        "conversation_id_key": "session_id"
      }
    },
    "show_quote_images": {
      "next": "conditional_options",
      "type": "action",
      "action": "display_order_uploads_admin",
      "action_config": {
        "conversation_id_key": "session_id"
      }
    },
    "summarize_specs": {
      "next": "wait_for_draft_save",
      "type": "action",
      "action": "ai_summarize_specs",
      "error_next": "manual_specs",
      "action_config": {
        "conversation_id_key": "session_id"
      }
    },
    "edit_saved_specs": {
      "next": "wait_for_draft_save",
      "type": "action",
      "action": "edit_saved_specs",
      "action_config": {
        "conversation_id_key": "session_id"
      }
    },
    "conditional_options": {
      "type": "message",
      "message": "Please select an option:",
      "options": [
        {
          "next": "summarize_specs",
          "label": "Summarize Order Specs",
          "value": "summarize_specs"
        },
        {
          "next": "manual_specs",
          "label": "Manual Order Specs",
          "value": "manual_specs"
        }
      ]
    },
    "wait_for_draft_save": {
      "type": "message",
      "message": "After saving the draft in the form, choose the next step.",
      "options": [
        {
          "next": "send_specs",
          "label": "Send Specs to Customer"
        },
        {
          "next": "edit_saved_specs",
          "label": "Edit Specs"
        },
        {
          "next": "end",
          "label": "End Chat"
        }
      ]
    }
  },
  "title": "Admin: Quote Proposal",
  "flow_id": "admin-quote-propose",
  "description": "Admin reviews a customer quote request, prepares specs, and sends proposal.",
  "initial_node": "greet"
}