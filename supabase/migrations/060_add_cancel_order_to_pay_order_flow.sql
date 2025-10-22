-- Add cancel order functionality to pay-order flow
-- This moves the cancel option from reupload-payment to the more logical pay-order flow

UPDATE chat_flows_v2
SET
  flow_definition = '{
    "flow_id": "pay-order",
    "title": "Pay for Order",
    "description": "Customer pays for their order by uploading payment proof or cancels the order",
    "initial_node": "intro_greet",
    "nodes": {
      "intro_greet": {
        "type": "message",
        "message": "Hi! I''m Printy, B.J. Santiago''s bot assistant. Let me pull up your order details.",
        "next": "show_accepted_specs"
      },
      "show_accepted_specs": {
        "type": "action",
        "action": "display_accepted_specs",
        "message": "",
        "action_config": {
          "order_id_key": "order_id"
        },
        "next": "show_payment_info"
      },
      "show_payment_info": {
        "type": "action",
        "action": "display_order_payment_info",
        "message": "",
        "action_config": {
          "order_id_key": "order_id"
        },
        "next": "show_payment_methods"
      },
      "show_payment_methods": {
        "type": "message",
        "message": "How would you like to pay for your order?",
        "options": [
          {
            "label": "Online Bank Transfer",
            "next": "show_bank_transfer",
            "value": "bank_transfer",
            "store_as": "selected_payment_method"
          },
          {
            "label": "QRPH Codes",
            "next": "show_qrph_codes",
            "value": "qrph",
            "store_as": "selected_payment_method"
          },
          {
            "label": "Cancel Order",
            "next": "ask_cancel_reason"
          }
        ]
      },
      "show_bank_transfer": {
        "type": "action",
        "action": "display_bank_transfer_details",
        "message": "",
        "action_config": {},
        "next": "bank_transfer_options"
      },
      "bank_transfer_options": {
        "type": "message",
        "message": "Please follow the bank transfer details above and upload your payment proof when done.",
        "options": [
          {
            "next": "show_payment_methods",
            "label": "Back to Payment Options"
          },
          {
            "next": "upload_payment_instructions",
            "label": "Upload Payment Proof"
          }
        ]
      },
      "show_qrph_codes": {
        "type": "action",
        "action": "display_qr_code_details",
        "message": "",
        "action_config": {},
        "next": "qr_code_options"
      },
      "qr_code_options": {
        "type": "message",
        "message": "Click button Upload Payment Method when ready to upload proof of payment. Make sure TRANSACTION ID and DATE & TIME are clearly visible.",
        "options": [
          {
            "next": "show_payment_methods",
            "label": "Back to Payment Options"
          },
          {
            "next": "upload_payment_instructions",
            "label": "Upload Payment Proof"
          }
        ]
      },
      "upload_payment_instructions": {
        "type": "message",
        "message": "Please click the attachment button below beside the typing area to upload your payment proof image.",
        "expects_input": true,
        "input_config": {
          "store_as": "user_input"
        },
        "next": "process_payment_upload"
      },
      "process_payment_upload": {
        "type": "action",
        "action": "process_payment_proof_upload",
        "message": "",
        "action_config": {
          "order_id_key": "order_id"
        },
        "next": "payment_uploaded"
      },
      "payment_uploaded": {
        "type": "message",
        "message": "Successfully uploaded the image! Your payment proof has been uploaded and is now being verified by our team. You will be notified once verification is complete.",
        "options": [
          {
            "next": "end",
            "label": "End Chat"
          }
        ]
      },
      "ask_cancel_reason": {
        "type": "message",
        "message": "I understand you want to cancel your order.\n\nCould you please tell us why you''re canceling? This helps us improve our service.",
        "expects_input": true,
        "input_config": {
          "store_as": "cancellation_reason",
          "required": true
        },
        "next": "handle_cancel"
      },
      "handle_cancel": {
        "type": "action",
        "action": "cancel_order",
        "message": "Processing your cancellation...",
        "action_config": {
          "order_id_key": "order_id",
          "reason_key": "cancellation_reason"
        },
        "next": "cancel_confirmation"
      },
      "cancel_confirmation": {
        "type": "message",
        "message": "Your order has been cancelled.\n\nWe''re sorry to see you go. If you have any questions or concerns, please don''t hesitate to reach out to us.\n\nThank you for considering B.J. Santiago!",
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
  updated_at = NOW()
WHERE flow_id = 'pay-order';