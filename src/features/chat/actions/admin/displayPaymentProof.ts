/**
 * Action handler: display_payment_proof
 *
 * Displays the payment proof image uploaded by the customer for admin review.
 * Shows the image URL in the message text so the chat UI can render it.
 *
 * @description
 * - Fetches order details by order_id from context
 * - Extracts payment_proof URL from order
 * - Includes image URL directly in message text (following displayQRCodeDetails pattern)
 * - Chat UI will automatically render the image from the URL
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing order_id
 * @param params.sessionId - Current admin chat session ID
 *
 * @returns ActionExecutionResult with payment proof image URL
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "show_payment_proof",
 *   "type": "action",
 *   "action": "display_payment_proof",
 *   "action_config": {
 *     "order_id_key": "order_id"
 *   },
 *   "next": "ask_verification"
 * }
 * ```
 *
 * @remarks
 * - Requires order_id in context
 * - Uses standardized error handling
 * - Image rendering handled by chat UI component
 * - Follows same pattern as displayQRCodeDetails for image URLs
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

export async function displayPaymentProof(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  return withErrorHandling(
    'display_payment_proof',
    async () => {
      const { actionNode, context, sessionId: _sessionId } = params;

      const config = actionNode.action_config as any;
      const orderIdKey = config?.order_id_key || 'order_id';
      const orderId = String(context[orderIdKey] || '').trim();

      // Validate required context
      const validationError = validateRequiredContext(
        { [orderIdKey]: orderId },
        [orderIdKey],
        'display_payment_proof'
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

      // Check if payment proof exists
      if (!orderDetails.paymentProof) {
        return {
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: 'No payment proof has been uploaded for this order.',
              ts: Date.now(),
            },
          ],
        };
      }

      // Format payment proof message with image URL
      // Following the pattern from displayQRCodeDetails.ts
      const paymentProofText = `Payment Proof Uploaded:\n\n${orderDetails.paymentProof}`;

      const messages: Array<{
        id: string;
        role: 'printy';
        text: string;
        ts: number;
      }> = [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: paymentProofText,
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
          payment_proof_url: orderDetails.paymentProof,
        },
      };
    },
    ErrorMessages.ORDER_LOAD_FAILED
  );
}
