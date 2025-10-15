import type { FlowDefinition } from '../types';

/**
 * Track Order Flow - Customer checks their order status
 *
 * Flow Steps:
 * 1. welcome - Ask for order ID
 * 2. lookup_order - Look up order in database (future action)
 * 3. show_status - Display order status
 * 4. end - End conversation
 *
 * Note: This flow needs a 'lookup_order' action to be implemented
 */
export const trackOrderFlow: FlowDefinition = {
  flow_id: 'track-order',
  title: 'Track My Order',
  description: 'Customer checks the status of their order',
  initial_node: 'welcome',

  nodes: {
    welcome: {
      type: 'message',
      message: `Hi! I'm Printy, B.J. Santiago's bot assistant. I can help you track your order.

Please enter your order ID (you can find this in your dashboard or confirmation email):

Example: ORD-12345`,
      expects_input: true,
      input_config: {
        store_as: 'order_id',
        required: true,
      },
      next: 'lookup_order',
    },

    lookup_order: {
      type: 'action',
      message: 'Let me look up your order. Hang on for a minute.',
      action: 'lookup_order' as any, // TODO: Implement this action
      action_config: {
        order_id_key: 'order_id',
      } as any,
      next: 'show_status',
    },

    show_status: {
      type: 'message',
      message: `ORDER STATUS

Your order is currently: [STATUS] Here is your Order ID:
Expected completion: [DATE]

We will keep you updated on any changes!`, // must show user the display_id of the order_id from the database
    },

    end: {
      type: 'end',
      message: 'Thanks for choosing B.J. Santiago! Have a great day!',
    },
  },
};
