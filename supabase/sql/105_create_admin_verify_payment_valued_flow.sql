-- Migration 105: Create admin-verify-payment-valued flow
-- Separate flow for valued customers where payment verification sets status to for_pickup or for_delivery
-- Mirrors admin-verify-payment flow but with additional step to choose delivery method

INSERT INTO chat_flows_v2 (flow_id, flow_definition, active, flow_owner, created_at, updated_at)
VALUES (
  'admin-verify-payment-valued',
  '{
    "flow_id": "admin-verify-payment-valued",
    "title": "Admin Verify Payment (Valued Customer)",
    "description": "Admin reviews and verifies valued customer payment proofs - sets status to For Pickup or For Delivery",
    "initial_node": "intro",
    "nodes": {
      "intro": {
        "type": "message",
        "message": "Hello I''m Printy! Your bot assistant. I''ll help you verify the payment proof for this valued customer order.",
        "next": "display_order_specs"
      },
      "display_order_specs": {
        "type": "action",
        "action": "display_order_specs",
        "action_config": {
          "order_id_key": "order_id"
        },
        "next": "display_quote_price"
      },
      "display_quote_price": {
        "type": "action",
        "action": "display_order_price",
        "action_config": {
          "order_id_key": "order_id"
        },
        "next": "display_payment_proof"
      },
      "display_payment_proof": {
        "type": "action",
        "action": "display_payment_proof",
        "action_config": {
          "order_id_key": "order_id"
        },
        "next": "ask_verification_action"
      },
      "ask_verification_action": {
        "type": "message",
        "message": "Based on the order details and payment proof above, what would you like to do?\n\nPlease review the payment proof carefully before making your decision.",
        "options": [
          {
            "label": "Verify Payment",
            "next": "ask_delivery_method",
            "value": "verify",
            "store_as": "verification_action"
          },
          {
            "label": "Deny Payment",
            "next": "ask_denial_reason",
            "value": "deny",
            "store_as": "verification_action"
          },
          {
            "label": "End Chat",
            "next": "end",
            "value": "end"
          }
        ]
      },
      "ask_delivery_method": {
        "type": "message",
        "message": "How should the order be fulfilled?",
        "options": [
          {
            "label": "For Pickup",
            "next": "verify_payment_node",
            "value": "pickup",
            "store_as": "delivery_method"
          },
          {
            "label": "For Delivery",
            "next": "verify_payment_node",
            "value": "delivery",
            "store_as": "delivery_method"
          }
        ]
      },
      "verify_payment_node": {
        "type": "action",
        "action": "verify_payment_valued",
        "action_config": {
          "order_id_key": "order_id",
          "delivery_method_key": "delivery_method"
        },
        "next": "verified_confirmation"
      },
      "verified_confirmation": {
        "type": "message",
        "message": "Payment has been verified successfully!\n\nThe customer will receive notifications about the payment verification and order status update.",
        "options": [
          {
            "label": "End Chat",
            "next": "end"
          }
        ]
      },
      "ask_denial_reason": {
        "type": "message",
        "message": "Please provide a reason for denying this payment proof.\n\nThis reason will be shared with the customer to help them understand what went wrong and how to fix it.",
        "expects_input": true,
        "input_config": {
          "store_as": "denial_reason",
          "required": true
        },
        "next": "deny_payment_node"
      },
      "deny_payment_node": {
        "type": "action",
        "action": "deny_payment",
        "action_config": {
          "order_id_key": "order_id",
          "denial_reason_key": "denial_reason"
        },
        "next": "denied_confirmation"
      },
      "denied_confirmation": {
        "type": "message",
        "message": "Payment has been denied.\n\nThe customer will be notified with the reason you provided and can upload a new payment proof when they''re ready.",
        "options": [
          {
            "label": "End Chat",
            "next": "end"
          }
        ]
      },
      "end": {
        "type": "end",
        "message": "Thank you for using Printy! Have a great day!"
      }
    }
  }'::jsonb,
  true,
  'admin',
  now(),
  now()
)
ON CONFLICT (flow_id) 
DO UPDATE SET
  flow_definition = EXCLUDED.flow_definition,
  active = EXCLUDED.active,
  updated_at = now();

