-- Update admin-verify-payment flow in chat_flows_v2
UPDATE chat_flows_v2 
SET 
  flow_definition = '{
    "flow_id": "admin-verify-payment",
    "title": "Admin Verify Payment",
    "description": "Admin reviews and verifies customer payment proofs for orders",
    "initial_node": "intro",
    "nodes": {
      "intro": {
        "type": "message",
        "message": "Hello I''m Printy! Your bot assistant. I''ll help you verify the payment proof for this order.",
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
            "next": "verify_payment_node",
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
      "verify_payment_node": {
        "type": "action",
        "action": "verify_payment",
        "action_config": {
          "order_id_key": "order_id"
        },
        "next": "verified_confirmation"
      },
      "verified_confirmation": {
        "type": "message",
        "message": "Payment has been verified successfully!\n\nOrder {{display_id}} has been updated to ''processing'' status. The customer will be notified of the verification and can now track their order progress in their dashboard.",
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
          "required": true,
          "validation": "min_length:10"
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
        "message": "Payment has been denied.\n\nOrder {{display_id}} has been updated to ''reupload_payment'' status. The customer will be notified with the reason you provided and can upload a new payment proof when they''re ready.",
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
  active = true,
  flow_owner = 'admin',
  updated_at = now()
WHERE flow_id = 'admin-verify-payment';
