/**
 * Action handler: fetch_denial_reason
 *
 * Fetches the payment denial reason directly from the orders table for the current order.
 * This is a critical initialization action that retrieves the admin's denial reason
 * before displaying it to the customer.
 *
 * @description
 * - Retrieves order_id from session context
 * - Queries orders table for the denial_reason column
 * - Stores denial data in current session context for use by subsequent message nodes
 * - Returns success or error if denial reason cannot be found
 *
 * Implementation Note:
 * The denial_reason is stored directly in the orders table when an admin denies
 * a payment proof. This avoids RLS (Row Level Security) issues that would occur
 * if we tried to query admin-verify-payment sessions which are owned by the admin.
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing order_id
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Customer viewing the denial reason
 *
 * @returns ActionExecutionResult with denial reason stored in context
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "fetch_denial_reason",
 *   "type": "action",
 *   "action": "fetch_denial_reason",
 *   "action_config": {
 *     "order_id_key": "order_id"
 *   },
 *   "next": "show_denial_reason"
 * }
 * ```
 *
 * @remarks
 * - Queries orders table directly (respects customer RLS policies)
 * - Requires orders.denial_reason column to be populated by admin
 * - Stores denial_reason and admin_denial_message in context for interpolation
 */

import { supabase } from '@lib/supabase';
import { withErrorHandling } from '@features/chat/helpers/errorHandling';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function fetchDenialReason(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  return withErrorHandling(
    'fetch_denial_reason',
    async () => {
      const { actionNode, context } = params;

      const config = actionNode.action_config as any;
      const orderIdKey = config?.order_id_key || 'order_id';
      const orderId = String(context[orderIdKey] || '').trim();

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      // Query orders table directly to get the denial reason
      // This avoids RLS issues with accessing admin-verify-payment sessions
      const { data: order, error: queryError } = await supabase
        .from('orders')
        .select('denial_reason, payment_denied_at, payment_denied_by')
        .eq('order_id', orderId)
        .single();

      if (queryError) {
        throw new Error(`Failed to query order: ${queryError.message}`);
      }

      if (!order) {
        throw new Error('Order not found');
      }

      if (!order.denial_reason) {
        throw new Error('No payment denial record found for this order');
      }

      const denialReason = order.denial_reason || 'No specific reason provided';

      // Return the denial reason as a message directly
      // No need to store in context since we're not using it elsewhere
      return {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'printy',
            text: `Reason for denial:\n\n${denialReason}`,
            ts: Date.now(),
          },
        ],
        context: {},
      };
    },
    'Failed to retrieve payment denial reason. Please try again.'
  );
}
