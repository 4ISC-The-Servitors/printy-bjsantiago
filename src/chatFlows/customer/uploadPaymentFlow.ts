import type { FlowDefinition } from '../types';

/**
 * Upload Payment Proof Flow - Customer uploads payment confirmation
 *
 * Flow Steps:
 * 1. welcome - Ask for order ID
 * 2. verify_order - Verify order exists (future action)
 * 3. request_upload - Request payment proof file
 * 4. process_upload - Process and store the uploaded file
 * 5. upload_complete - Confirmation message
 * 6. end - End conversation
 */
export const uploadPaymentFlow: FlowDefinition = {
  flow_id: 'upload-payment',
  title: 'Upload Payment Proof',
  description: 'Customer uploads proof of payment for their order',
  initial_node: 'welcome',

  nodes: {
    welcome: {
      type: 'message',
      message: `Hi! I'm Printy, B.J. Santiago's bot assistant. I'll help you upload your payment proof.

Please enter your order ID (you can find this in your dashboard or confirmation email):

Example: ORD-12345`,
      expects_input: true,
      input_config: {
        store_as: 'order_id',
        required: true,
      },
      next: 'verify_order',
    },

    verify_order: {
      type: 'action',
      message: 'Let me verify your order. Hang on for a minute.',
      action: 'verify_order',
      action_config: {
        order_id_key: 'order_id',
      },
      next: 'request_upload',
    },

    request_upload: {
      type: 'message',
      message: `Great! Now please upload your payment proof.

Accepted formats: JPG, PNG, PDF
Maximum file size: 10MB

Please ensure the image is clear and shows:
- Transaction date and time
- Amount paid
- Reference number (if applicable)`,
      expects_input: true,
      input_config: {
        store_as: 'payment_proof_file',
        required: true,
      },
      next: 'process_upload',
    },

    process_upload: {
      type: 'action',
      message: 'Processing your payment proof...',
      action: 'upload_payment_proof',
      action_config: {
        order_id_key: 'order_id',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        file_key: 'payment_proof_file',
      },
      next: 'upload_complete',
    },

    upload_complete: {
      type: 'message',
      message: `Your payment proof has been uploaded successfully!

Our team will verify your payment and update your order status shortly. You can track the status in your dashboard.

We'll notify you once the payment is confirmed!`, // must show user the display_id of the order_id from the database
      options: [{ label: 'End Chat', next: 'end' }],
    },

    end: {
      type: 'end',
      message:
        'Thanks for uploading your payment proof. We will process it soon!',
    },
  },
};
