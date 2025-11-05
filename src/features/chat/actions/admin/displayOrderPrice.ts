/**
 * Action handler: display_order_price
 *
 * Displays the agreed quote price for an order in a formatted message.
 * Shows the total amount that was agreed upon during the quote process.
 *
 * @description
 * - Fetches order details by order_id from context
 * - Extracts total_amount from order
 * - Formats price with currency symbol and proper number formatting
 * - Returns formatted price message
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing order_id
 * @param params.sessionId - Current admin chat session ID
 *
 * @returns ActionExecutionResult with formatted price information
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "show_price",
 *   "type": "action",
 *   "action": "display_order_price",
 *   "action_config": {
 *     "order_id_key": "order_id"
 *   },
 *   "next": "show_payment_proof"
 * }
 * ```
 *
 * @remarks
 * - Requires order_id in context
 * - Uses standardized error handling
 * - Displays price in PHP currency format
 */

import { fetchOrderDetails } from '@features/chat/helpers/orderDetailsHelper';
import {
  withErrorHandling,
  ErrorMessages,
  validateRequiredContext,
} from '@features/chat/helpers/errorHandling';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';
import { formatCurrency } from '@shared/utils/priceFormatter';

export async function displayOrderPrice(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  return withErrorHandling(
    'display_order_price',
    async () => {
      const { actionNode, context, sessionId: _sessionId } = params;

      const config = actionNode.action_config as any;
      const orderIdKey = config?.order_id_key || 'order_id';
      const orderId = String(context[orderIdKey] || '').trim();

      // Validate required context
      const validationError = validateRequiredContext(
        { [orderIdKey]: orderId },
        [orderIdKey],
        'display_order_price'
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

      // Format price message
      const priceText = `Agreed Quote Price: ${formatCurrency(Number(orderDetails.totalAmount || 0))}`;

      const messages: Array<{
        id: string;
        role: 'printy';
        text: string;
        ts: number;
      }> = [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: priceText,
          ts: Date.now(),
        },
      ];

      // ✅ FIX: Don't insert message here - JsonbFlowProcessor caller will handle it
      // This prevents duplicate messages in the database

      return {
        messages,
        context: {
          // Ensure order_id is maintained in context
          order_id: orderDetails.orderId,
          total_amount: orderDetails.totalAmount,
        },
      };
    },
    ErrorMessages.ORDER_LOAD_FAILED
  );
}
