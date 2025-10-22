/**
 * Action handler: show_customer_orders
 *
 * Displays customer's active orders as quick replies for order selection.
 * This eliminates the need for manual order ID input and validation.
 *
 * @description
 * - Queries customer's orders that are not completed or cancelled
 * - Formats orders as "ORD-XXXXXX - Product Name" quick replies
 * - Includes "No order related" option for non-order specific issues
 * - Returns dynamic quick replies based on customer's order history
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing inquiry_type and issue_details
 * @param params.customerId - Customer whose orders to display
 * @param params.sessionId - Current chat session ID
 *
 * @returns ActionExecutionResult with dynamic quick replies for order selection
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "show_orders",
 *   "type": "action",
 *   "action": "show_customer_orders",
 *   "action_config": {
 *     "type_key": "inquiry_type",
 *     "details_key": "issue_details"
 *   }
 * }
 * ```
 */
import { supabase } from '@lib/supabase';
import type { ActionExecutionParams, ActionExecutionResult } from '@features/chat/types';

export async function showCustomerOrders(params: ActionExecutionParams): Promise<ActionExecutionResult> {
  const { customerId } = params;
  const messages: Array<{ id: string; role: 'printy'; text: string; ts: number }> = [];

  try {
    // Query customer's active orders (not completed or cancelled)
    const { data: orders, error } = await supabase
      .from('orders')
      .select('display_id, order_id, order_specs, status')
      .eq('customer_id', customerId)
      .not('status', 'in', '("completed", "cancelled")')
      .order('created_at', { ascending: false })
      .limit(10); // Limit to 10 most recent orders

    if (error) {
      console.error('Failed to fetch customer orders:', error);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I had trouble loading your order history. Please try again.',
        ts: Date.now(),
      });
      return {
        messages,
        quickReplies: [
          {
            label: 'Try Again',
            value: 'retry',
            next: 'ask_order_id'
          }
        ]
      };
    }

    const quickReplies: Array<{ label: string; value: string; next: string }> = [];

    if (orders && orders.length > 0) {
      // Simple message asking for order selection
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: "Please select the order related to your issue, or choose 'My issue is not order related':",
        ts: Date.now(),
      });

      // Build quick replies for order selection
      orders.forEach((order) => {
        const productName = order.order_specs?.product_name || 'Unknown Product';
        const orderDisplay = `${order.display_id} - ${productName}`;

        quickReplies.push({
          label: orderDisplay,
          value: order.display_id,
          next: 'create_ticket'
        });
      });

      // Add option for non-order related issues
      quickReplies.push({
        label: 'My issue is not order related',
        value: 'no_order',
        next: 'create_ticket'
      });
    } else {
      // No active orders found
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: "I don't see any active orders in your account. That's okay - we can still help with your issue!",
        ts: Date.now(),
      });

      quickReplies.push({
        label: 'Continue without order',
        value: 'no_order',
        next: 'create_ticket'
      });
    }

    return {
      messages,
      quickReplies
    };

  } catch (error) {
    console.error('Error in showCustomerOrders:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Something went wrong while loading your orders. Please try again.',
      ts: Date.now(),
    });

    return {
      messages,
      quickReplies: [
        {
          label: 'Try Again',
          value: 'retry',
          next: 'ask_order_id'
        }
      ]
    };
  }
}