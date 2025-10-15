-- ============================================================================
-- Insert Customer Flow Definitions into chat_flows_v2
-- Based on: src/chatFlows/customer/
-- ============================================================================

-- Flow 1: Ask Quote
INSERT INTO chat_flows_v2 (flow_id, flow_definition, active)
VALUES (
  'ask-quote',
  '{
    "flow_id": "ask-quote",
    "title": "Request a Quote",
    "description": "Customer describes what they want printed and submits a quote request",
    "initial_node": "intro",
    "nodes": {
      "intro": {
        "type": "message",
        "message": "Hi! I''m Printy, B.J. Santiago''s bot assistant. Let''s get you a quote for the product you want printed!\n\nPlease describe what you''d like printed. Include as many details as possible:\n\n• Item type (business cards, flyers, banners, etc.)\n• Size and dimensions (e.g., 3.5\" x 2\", A4, custom)\n• Quantity (how many do you need?)\n• Materials or finishing (glossy, matte, cardstock, etc.)\n• Your deadline (when do you need it by?)",
        "expects_input": true,
        "input_config": {
          "store_as": "quote_details",
          "required": true
        },
        "next": "create_quote"
      },
      "create_quote": {
        "type": "action",
        "message": "Let me process your quote request. Hang on for a minute.",
        "action": "create_quote_conversation",
        "action_config": {
          "details_key": "quote_details",
          "show_display_id": true
        },
        "next": "quote_created"
      },
      "quote_created": {
        "type": "message",
        "message": "Your quote request has been submitted successfully! Here is your Quote ID:\n\nOur team will review your requirements and send you a detailed proposal with pricing soon. You can track your quote status in your dashboard.\n\nWe''ll notify you as soon as we have an update!",
        "options": [
          {
            "label": "End Chat",
            "next": "end"
          }
        ]
      },
      "end": {
        "type": "end",
        "message": "Thanks for choosing B.J. Santiago! Have a great day!"
      }
    }
  }'::jsonb,
  true
)
ON CONFLICT (flow_id) DO UPDATE
SET flow_definition = EXCLUDED.flow_definition,
    updated_at = now();

-- Flow 2: Issue Ticket
INSERT INTO chat_flows_v2 (flow_id, flow_definition, active)
VALUES (
  'issue-ticket',
  '{
    "flow_id": "issue-ticket",
    "title": "Report an Issue",
    "description": "Customer submits a support ticket for quality, delivery, or billing issues",
    "initial_node": "welcome",
    "nodes": {
      "welcome": {
        "type": "message",
        "message": "Hi! I''m Printy, B.J. Santiago''s bot assistant. I''m here to help with any issues you''re experiencing.\n\nWhat type of issue are you facing?",
        "options": [
          {
            "label": "Printing Quality Issue",
            "next": "collect_details",
            "value": "quality",
            "store_as": "inquiry_type"
          },
          {
            "label": "Delivery Problem",
            "next": "collect_details",
            "value": "delivery",
            "store_as": "inquiry_type"
          },
          {
            "label": "Billing Problem",
            "next": "collect_details",
            "value": "billing",
            "store_as": "inquiry_type"
          },
          {
            "label": "Other Concern",
            "next": "collect_details",
            "value": "other",
            "store_as": "inquiry_type"
          }
        ]
      },
      "collect_details": {
        "type": "message",
        "message": "Please describe your issue in detail. Include:\n\n• What happened?\n• When did it happen?\n• What you expected vs. what you received?\n• Any other relevant information",
        "expects_input": true,
        "input_config": {
          "store_as": "issue_details",
          "required": true
        },
        "next": "ask_order_id"
      },
      "ask_order_id": {
        "type": "message",
        "message": "Is this issue related to a specific order?",
        "options": [
          {
            "label": "Yes, I have an order ID",
            "next": "collect_order_id"
          },
          {
            "label": "No, not order-related",
            "next": "create_ticket"
          }
        ]
      },
      "collect_order_id": {
        "type": "message",
        "message": "Please enter your order ID (e.g., ORD-12345):",
        "expects_input": true,
        "input_config": {
          "store_as": "order_id",
          "required": false
        },
        "next": "create_ticket"
      },
      "create_ticket": {
        "type": "action",
        "message": "Let me create your support ticket. Hang on for a minute.",
        "action": "create_inquiry",
        "action_config": {
          "type_key": "inquiry_type",
          "details_key": "issue_details",
          "order_id_key": "order_id",
          "show_inquiry_id": true
        },
        "next": "ticket_created"
      },
      "ticket_created": {
        "type": "message",
        "message": "Your support ticket has been created! Here is your Ticket ID:\n\nOur team will review your issue and get back to you as soon as possible. You can track the status of your ticket in your dashboard.\n\nWe appreciate your patience!",
        "options": [
          {
            "label": "End Chat",
            "next": "end"
          }
        ]
      },
      "end": {
        "type": "end",
        "message": "Thanks for reaching out to B.J. Santiago! We will be in touch soon!"
      }
    }
  }'::jsonb,
  true
)
ON CONFLICT (flow_id) DO UPDATE
SET flow_definition = EXCLUDED.flow_definition,
    updated_at = now();

-- Flow 3: Track Order (placeholder - needs lookup_order action implementation)
INSERT INTO chat_flows_v2 (flow_id, flow_definition, active)
VALUES (
  'track-order',
  '{
    "flow_id": "track-order",
    "title": "Track My Order",
    "description": "Customer checks the status of their order",
    "initial_node": "welcome",
    "nodes": {
      "welcome": {
        "type": "message",
        "message": "Hi! I''m Printy, B.J. Santiago''s bot assistant. I can help you track your order.\n\nPlease enter your order ID (you can find this in your dashboard or confirmation email):\n\nExample: ORD-12345",
        "expects_input": true,
        "input_config": {
          "store_as": "order_id",
          "required": true
        },
        "next": "end"
      },
      "end": {
        "type": "end",
        "message": "Thanks for choosing B.J. Santiago! Have a great day!"
      }
    }
  }'::jsonb,
  false
)
ON CONFLICT (flow_id) DO UPDATE
SET flow_definition = EXCLUDED.flow_definition,
    updated_at = now();

-- Flow 4: Upload Payment (placeholder - needs verify_order action implementation)
INSERT INTO chat_flows_v2 (flow_id, flow_definition, active)
VALUES (
  'track-quote',
  '{
    "flow_id": "track-quote",
    "title": "Track Quote",
    "description": "Customer tracks an existing printing quote and reviews proposals",
    "initial_node": "intro",
    "nodes": {
      "intro": {
        "type": "action",
        "message": "Hi, I''m Printy, B.J. Santiago''s bot assistant. Let me pull up your quote request details for you.",
        "action": "display_quote_details",
        "action_config": {
          "conversation_id_key": "conversation_id"
        },
        "next": "await_response"
      },
      "await_response": {
        "type": "message",
        "message": "IMPORTANT: Once you accept this quote, you CANNOT cancel your order. Payment is required upfront before we begin processing your order.",
        "options": [
          {
            "label": "Accept Quote",
            "next": "accept_quote"
          },
          {
            "label": "Reject Quote",
            "next": "reject_quote"
          },
          {
            "label": "End Chat",
            "next": "end"
          }
        ]
      },
      "accept_quote": {
        "type": "action",
        "message": "",
        "action": "accept_quote_proposal",
        "action_config": {
          "conversation_id_key": "conversation_id"
        },
        "next": "quote_accepted"
      },
      "quote_accepted": {
        "type": "message",
        "message": "Great! You have accepted the quote proposal.\n\nOur admin will create your order and you will be instructed to pay for it before your order gets processed.\n\nThank you for choosing B.J. Santiago!",
        "options": [
          {
            "label": "End Chat",
            "next": "end"
          }
        ]
      },
      "reject_quote": {
        "type": "action",
        "message": "",
        "action": "reject_quote_proposal",
        "action_config": {
          "conversation_id_key": "conversation_id"
        },
        "next": "quote_rejected"
      },
      "quote_rejected": {
        "type": "message",
        "message": "You have rejected the quote proposal.\n\nIf you would like to request a new quote or discuss modifications, please start a new quote request or contact our admin team.\n\nThank you for considering B.J. Santiago!",
        "options": [
          {
            "label": "End Chat",
            "next": "end"
          }
        ]
      },
      "end": {
        "type": "end",
        "message": "Thanks for choosing B.J. Santiago! Have a great day!"
      }
    }
  }'::jsonb,
  true
)
ON CONFLICT (flow_id) DO UPDATE
SET flow_definition = EXCLUDED.flow_definition,
    updated_at = now();

-- ============================================================================
-- Verification Query
-- ============================================================================

-- View all inserted flows
-- SELECT flow_id, active, created_at, updated_at FROM chat_flows_v2;

