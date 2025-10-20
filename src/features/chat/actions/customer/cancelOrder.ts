/**
 * Action handler: cancel_order
 *
 * Allows customers to cancel their order and provide a reason for the cancellation.
 * The cancellation reason is stored in session metadata for reference but not in the
 * orders table.
 *
 * @description
 * - Captures cancellation reason from user input via context
 * - Validates order exists and belongs to the customer
 * - Updates order status to 'cancelled'
 * - Stores cancellation reason in session metadata context for reference
 * - Returns success or error message
 *
 * Flow:
 * 1. User chooses "Cancel Order" option
 * 2. Flow asks for cancellation reason (text input)
 * 3. This action receives order_id and cancellation_reason from context
 * 4. Updates order status to 'cancelled'
 * 5. Stores reason in session metadata (not in orders table)
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing order_id and cancellation_reason
 * @param params.customerId - Customer cancelling the order
 * @param params.sessionId - Current chat session ID
 *
 * @returns ActionExecutionResult with cancellation status message
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "handle_cancel",
 *   "type": "action",
 *   "action": "cancel_order",
 *   "action_config": {
 *     "order_id_key": "order_id",
 *     "reason_key": "cancellation_reason"
 *   },
 *   "next": "cancel_confirmation"
 * }
 * ```
 *
 * @remarks
 * - Ensures customer can only cancel their own orders
 * - Cancellation reason stored in session metadata for admin reference
 * - Does not add cancellation reason to orders table
 * - Order status change triggers any relevant database triggers
 */

import { supabase } from '@lib/supabase';
import {
  withErrorHandling,
  ErrorMessages,
  validateRequiredContext,
} from '@features/chat/helpers/errorHandling';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function cancelOrder(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  return withErrorHandling(
    'cancel_order',
    async () => {
      const { actionNode, context, customerId } = params;

      const config = actionNode.action_config as any;
      const orderIdKey = config?.order_id_key || 'order_id';
      const reasonKey = config?.reason_key || 'cancellation_reason';

      const orderId = String(context[orderIdKey] || '').trim();
      const cancellationReason = String(context[reasonKey] || '').trim();

      if (!orderId || !cancellationReason) {
        throw new Error('Order ID and cancellation reason are required');
      }

      // Validate that order exists and belongs to customer
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('order_id, display_id, status, customer_id')
        .eq('order_id', orderId)
        .eq('customer_id', customerId)
        .maybeSingle();

      if (orderError || !order) {
        throw new Error('Order not found or access denied');
      }

      // Check if order is already in a final state
      if (order.status === 'cancelled' || order.status === 'completed') {
        throw new Error(`Order has already been ${order.status}`);
      }

      // Update order status to cancelled
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
        .eq('customer_id', customerId);

      if (updateError) {
        throw new Error(`Failed to cancel order: ${updateError.message}`);
      }

      // Success - no messages, let the flow handle messaging
      // Return context update with cancellation_reason preserved for display
      return {
        messages: [],
        context: {
          cancellation_reason: cancellationReason,
        },
      };
    },
    'Failed to cancel your order. Please try again.'
  );
}
