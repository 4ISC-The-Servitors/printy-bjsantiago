-- Update issue-ticket flow to show customer orders as quick replies instead of manual input
-- This eliminates validation errors and improves user experience

UPDATE chat_flows_v2
SET flow_definition = '{
  "nodes": {
    "end": {
      "type": "end",
      "message": "Thanks for reaching out to B.J. Santiago! We will be in touch soon!"
    },
    "welcome": {
      "type": "message",
      "message": "Hi! I''m Printy, B.J. Santiago''s bot assistant. I''m here to help with any issues you''re experiencing.\n\nWhat type of issue are you facing?",
      "options": [
        {
          "next": "collect_details",
          "label": "Printing Quality Issue",
          "value": "quality",
          "store_as": "inquiry_type"
        },
        {
          "next": "collect_details",
          "label": "Delivery Problem",
          "value": "delivery",
          "store_as": "inquiry_type"
        },
        {
          "next": "collect_details",
          "label": "Billing Problem",
          "value": "billing",
          "store_as": "inquiry_type"
        },
        {
          "next": "collect_details",
          "label": "Other Concern",
          "value": "other",
          "store_as": "inquiry_type"
        }
      ]
    },
    "ask_order_related": {
      "type": "message",
      "message": "Is this issue related to a specific order?",
      "options": [
        {
          "next": "ask_order_id",
          "label": "Yes",
          "value": "yes",
          "store_as": "is_order_related"
        },
        {
          "next": "create_ticket",
          "label": "No",
          "value": "no",
          "store_as": "is_order_related"
        }
      ]
    },
    "ask_order_id": {
      "type": "action",
      "action": "show_customer_orders",
      "action_config": {
        "type_key": "inquiry_type",
        "details_key": "issue_details"
      }
    },
    "create_ticket": {
      "next": "ticket_created",
      "type": "action",
      "action": "create_inquiry",
      "action_config": {
        "type_key": "inquiry_type",
        "details_key": "issue_details",
        "order_id_key": "order_id",
        "show_inquiry_id": true
      }
    },
    "ticket_created": {
      "type": "message",
      "message": [],
      "options": [
        {
          "next": "end",
          "label": "End Chat"
        }
      ]
    },
    "collect_details": {
      "next": "ask_order_related",
      "type": "message",
      "message": "Please describe your issue in detail. Include:\n\n• What happened?\n• When did it happen?\n• What you expected vs. what you received?\n• Any other relevant information",
      "input_config": {
        "required": true,
        "store_as": "issue_details"
      },
      "expects_input": true
    }
  },
  "title": "Report an Issue",
  "flow_id": "issue-ticket",
  "description": "Customer submits a support ticket for quality, delivery, or billing issues with optional order selection",
  "initial_node": "welcome"
}'::jsonb,
updated_at = NOW()
WHERE flow_id = 'issue-ticket' AND active = true;

-- Log the update for debugging purposes
DO $$
BEGIN
    RAISE NOTICE 'Updated issue-ticket flow to use show_customer_orders action for order selection';
END $$;