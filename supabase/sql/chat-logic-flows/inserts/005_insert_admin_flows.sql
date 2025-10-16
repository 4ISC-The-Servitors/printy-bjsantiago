-- ============================================================================
-- Insert Admin Flow Definitions into chat_flows_v2
-- Based on: src/chatFlows/admin/quoteProposeFlow.json
-- ============================================================================

-- Admin Flow: Quote Propose (admin-initiated)
INSERT INTO chat_flows_v2 (flow_id, flow_definition, active)
VALUES (
  'admin-quote-propose',
  '{
    "flow_id": "admin-quote-propose",
    "title": "Admin: Quote Proposal",
    "description": "Admin reviews a customer quote request, prepares specs, and sends proposal.",
    "initial_node": "greet",
    "nodes": {
      "greet": {
        "type": "message",
        "message": "Hi! I''m Printy, your bot assistant. Let''s work on this quote request.",
        "next": "show_details"
      },
      "show_details": {
        "type": "action",
        "message": "Loading quote details...",
        "action": "display_quote_details",
      "action_config": { "conversation_id_key": "session_id" },
        "next": "choose_action"
      },
      "choose_action": {
        "type": "message",
        "message": "Choose how to prepare the specifications.",
        "options": [
          { "label": "Summarize Order Specs", "next": "summarize_specs" },
          { "label": "Manual Order Specs", "next": "manual_specs" },
          { "label": "End Chat", "next": "end" }
        ]
      },
      "summarize_specs": {
        "type": "action",
        "message": "Analyzing conversation and preparing order specifications...",
        "action": "ai_summarize_specs",
      "action_config": { "conversation_id_key": "session_id" },
        "next": "wait_for_draft_save"
      },
      "manual_specs": {
        "type": "message",
        "message": "Opening manual specification form... Please fill out the details and save the draft.",
        "next": "wait_for_draft_save"
      },
      "wait_for_draft_save": {
        "type": "message",
        "message": "After saving the draft in the form, choose the next step.",
        "options": [
          { "label": "Send Specs to Customer", "next": "send_specs" },
          { "label": "Edit Specs Again", "next": "choose_action" },
          { "label": "End Chat", "next": "end" }
        ]
      },
      "send_specs": {
        "type": "action",
        "message": "Sending proposal to customer...",
        "action": "send_quote_proposal",
      "action_config": { "conversation_id_key": "session_id" },
        "next": "sent_confirmation"
      },
      "sent_confirmation": {
        "type": "message",
        "message": "Proposal sent to customer. They can now review and respond.",
        "options": [ { "label": "End Chat", "next": "end" } ]
      },
      "end": {
        "type": "end",
        "message": "Thanks for using Printy! Have a great day!"
      }
    }
  }'::jsonb,
  true
)
ON CONFLICT (flow_id) DO UPDATE
SET flow_definition = EXCLUDED.flow_definition,
    updated_at = now();

-- Verification
-- SELECT flow_id, active FROM chat_flows_v2 WHERE flow_id = 'admin-quote-propose';


