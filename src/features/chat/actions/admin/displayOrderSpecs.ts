/**
 * Action handler: display_order_specs
 *
 * Displays order specifications in a formatted bullet-point style for admin review.
 * Shows product details, specifications, and other order information.
 *
 * @description
 * - Fetches order details by order_id from context
 * - Formats order specifications using bullet points
 * - Displays product name, category, description, size, materials, color, finishing, quantity, deadline, notes
 * - Uses shared orderDetailsHelper for consistent formatting
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing order_id
 * @param params.sessionId - Current admin chat session ID
 *
 * @returns ActionExecutionResult with formatted order specifications
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "show_order_specs",
 *   "type": "action",
 *   "action": "display_order_specs",
 *   "action_config": {
 *     "order_id_key": "order_id"
 *   },
 *   "next": "show_price"
 * }
 * ```
 *
 * @remarks
 * - Requires order_id in context
 * - Uses standardized error handling
 * - Formats specs consistently with other order display actions
 */

import {
  fetchOrderDetails,
  formatOrderSpecs,
} from '@features/chat/helpers/orderDetailsHelper';
import {
  withErrorHandling,
  ErrorMessages,
  validateRequiredContext,
} from '@features/chat/helpers/errorHandling';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function displayOrderSpecs(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  return withErrorHandling(
    'display_order_specs',
    async () => {
      const { actionNode, context, sessionId: _sessionId } = params;

      const config = actionNode.action_config as any;
      const orderIdKey = config?.order_id_key || 'order_id';
      const orderId = String(context[orderIdKey] || '').trim();

      // Validate required context
      const validationError = validateRequiredContext(
        { [orderIdKey]: orderId },
        [orderIdKey],
        'display_order_specs'
      );
      if (validationError) {
        return validationError;
      }

      // Fetch order details
      const orderDetails = await fetchOrderDetails(orderId);
      if (!orderDetails) {
        return {
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: ErrorMessages.ORDER_NOT_FOUND,
              ts: Date.now(),
            },
          ],
        };
      }

      // Format order specifications
      const specLines = await formatOrderSpecs(orderDetails.orderSpecs);

      let specsText = `Order Specifications:\n\n`;
      if (specLines.length > 0) {
        specsText += specLines.join('\n');
      } else {
        specsText += 'No specifications found for this order.';
      }

      const messages: Array<{
        id: string;
        role: 'printy';
        text: string;
        ts: number;
      }> = [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: specsText,
          ts: Date.now(),
        },
      ];

      // ✅ FIX: Don't insert message here - JsonbFlowProcessor caller will handle it
      // This prevents duplicate messages in the database

      return {
        messages,
        context: {
          // Store order details for downstream actions
          order_id: orderDetails.orderId,
          display_id: orderDetails.displayId,
          customer_id: orderDetails.customerId,
          order_status: orderDetails.status,
        },
      };
    },
    ErrorMessages.ORDER_LOAD_FAILED
  );
}
