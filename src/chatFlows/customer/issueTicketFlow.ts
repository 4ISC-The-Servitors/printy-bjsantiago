import type { FlowDefinition } from '../types';

/**
 * Issue Ticket Flow - Customer submits a support ticket
 *
 * Flow Steps:
 * 1. welcome - Welcome and ask for issue type
 * 2. collect_details - Collect detailed description
 * 3. ask_order_id - (Optional) Ask if issue is order-related
 * 4. collect_order_id - (Optional) Collect order ID
 * 5. create_ticket - Create inquiry in database
 * 6. ticket_created - Confirmation message
 * 7. end - End conversation
 */
export const issueTicketFlow: FlowDefinition = {
  flow_id: 'issue-ticket',
  title: 'Report an Issue',
  description:
    'Customer submits a support ticket for quality, delivery, or billing issues',
  initial_node: 'welcome',

  nodes: {
    welcome: {
      type: 'message',
      message: `Hi! I'm Printy, B.J. Santiago's bot assistant. I'm here to help with any issues you're experiencing.

What type of issue are you facing?`,
      options: [
        {
          label: 'Printing Quality Issue',
          next: 'collect_details',
          value: 'quality',
          store_as: 'inquiry_type',
        },
        {
          label: 'Delivery Problem',
          next: 'collect_details',
          value: 'delivery',
          store_as: 'inquiry_type',
        },
        {
          label: 'Billing Problem',
          next: 'collect_details',
          value: 'billing',
          store_as: 'inquiry_type',
        },
        {
          label: 'Other Concern',
          next: 'collect_details',
          value: 'other',
          store_as: 'inquiry_type',
        },
      ],
    },

    collect_details: {
      type: 'message',
      message: `Please describe your issue in detail. Include:

• What happened?
• When did it happen?
• What you expected vs. what you received?
• Any other relevant information`,
      expects_input: true,
      input_config: {
        store_as: 'issue_details',
        required: true,
      },
      next: 'ask_order_id',
    },

    ask_order_id: {
      type: 'message',
      message: 'Is this issue related to a specific order?',
      options: [
        { label: 'Yes, I have an order ID', next: 'collect_order_id' },
        { label: 'No, not order-related', next: 'create_ticket' },
      ],
    },

    collect_order_id: {
      type: 'message',
      message: 'Please enter your order ID (e.g., ORD-12345):',
      expects_input: true,
      input_config: {
        store_as: 'order_id',
        required: false,
      },
      next: 'create_ticket',
    },

    create_ticket: {
      type: 'action',
      message: 'Let me create your support ticket. Hang on for a minute.',
      action: 'create_inquiry',
      action_config: {
        type_key: 'inquiry_type',
        details_key: 'issue_details',
        order_id_key: 'order_id',
        show_inquiry_id: true,
      },
      next: 'ticket_created',
    },

    ticket_created: {
      type: 'message',
      message: `Your support ticket has been created! Here is your Ticket ID:

Our team will review your issue and get back to you as soon as possible. You can track the status of your ticket in your dashboard.

We appreciate your patience!`, // must show user the display_id of the inquiry_id from the database
      options: [{ label: 'End Chat', next: 'end' }],
    },

    end: {
      type: 'end',
      message: 'Thanks for reaching out to B.J. Santiago! We will be in touch soon!',
    },
  },
};
