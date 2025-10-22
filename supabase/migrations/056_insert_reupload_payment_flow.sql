-- Update reupload-payment flow in chat_flows_v2
UPDATE chat_flows_v2
SET
  flow_owner = 'customer',
  active = true,
  flow_definition = '{
    "flow_id": "reupload-payment",
    "title": "Reupload Payment Proof",
    "description": "Customer reuploads payment proof after admin denial or cancels their order",
    "initial_node": "greeting",
    "nodes": {
      "fetch_denial_reason": {
        "type": "action",
        "message": "Let me check the details of your payment denial...",
        "action": "fetch_denial_reason",
        "action_config": {
          "order_id_key": "order_id"
        },
        "next": "ask_action"
      },
      "greeting": {
        "type": "message",
        "message": "Hi! I''m Printy, B.J. Santiago''s bot assistant.\n\nI see that your payment for order was not accepted.",
        "next": "fetch_denial_reason"
      },
        "ask_action": {
        "type": "message",
        "message": "What would you like to do?",
        "options": [
          {
            "label": "Reupload Payment Proof",
            "next": "request_upload"
          },
          {
            "label": "End Chat",
            "next": "end"
          }
        ]
      },
      "request_upload": {
        "type": "message",
        "message": "Please click the attachment button below beside the typing area to upload your payment proof image.",
        "expects_input": true,
        "input_config": {
          "store_as": "payment_proof_file",
          "required": true
        },
        "next": "handle_upload"
      },
      "handle_upload": {
        "type": "action",
        "message": "Processing your payment proof...",
        "action": "reupload_payment_proof",
        "action_config": {
          "order_id_key": "order_id",
          "file_key": "payment_proof_file",
          "allowed_formats": ["jpg", "jpeg", "png", "pdf"]
        },
        "next": "success_message"
      },
      "success_message": {
        "type": "message",
        "message": "Your payment proof has been uploaded successfully!\n\nOur team will verify your payment and update your order status shortly. You can track the status in your dashboard.\n\nWe''ll notify you once the payment is confirmed!",
        "options": [
          {
            "label": "End Chat",
            "next": "end"
          }
        ]
      },
        "end": {
        "type": "end",
        "message": "Thank you for choosing B.J. Santiago. Have a great day!"
      }
    }
  }'::jsonb,
  updated_at = NOW()
WHERE flow_id = 'reupload-payment';
