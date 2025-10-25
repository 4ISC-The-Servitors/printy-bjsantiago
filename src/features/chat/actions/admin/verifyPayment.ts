/**
 * Action handler: verify_payment
 *
 * Verifies a customer's payment proof and updates the order status to 'processing'.
 * Sets verification timestamps and admin user information.
 *
 * @description
 * - Updates order status to 'processing'
 * - Sets payment_verified_at to current timestamp
 * - Sets payment_verified_by to admin user ID
 * - Returns context updates for SessionStateManager batching
 * - Provides confirmation message to admin
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing order_id
 * @param params.sessionId - Current admin chat session ID
 * @param params.customerId - Not used (admin action)
 *
 * @returns ActionExecutionResult with verification confirmation
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "verify_payment",
 *   "type": "action",
 *   "action": "verify_payment",
 *   "action_config": {
 *     "order_id_key": "order_id"
 *   },
 *   "next": "verified_confirmation"
 * }
 * ```
 *
 * @remarks
 * - Requires order_id in context
 * - Uses standardized error handling
 * - Returns context updates (not direct DB writes) per SessionStateManager pattern
 * - Admin ID should be available from session metadata or authentication context
 */

import { supabase } from '@lib/supabase';
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

export async function verifyPayment(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  return withErrorHandling(
    'verify_payment',
    async () => {
      const { actionNode, context } = params;

      const config = actionNode.action_config as any;
      const orderIdKey = config?.order_id_key || 'order_id';
      const orderId = String(context[orderIdKey] || '').trim();

      // Validate required context
      const validationError = validateRequiredContext(
        { [orderIdKey]: orderId },
        [orderIdKey],
        'verify_payment'
      );
      if (validationError) {
        return validationError;
      }

      // Fetch order details to verify it exists and get current status
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

      // Verify order is in correct status for verification
      if (orderDetails.status !== 'verifying_payment') {
        return {
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: `Order is not in 'verifying_payment' status. Current status: ${orderDetails.status}`,
              ts: Date.now(),
            },
          ],
        };
      }

      // Get current authenticated admin user ID
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        console.error('[verifyPayment] Error getting current user:', userError);
        return {
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: 'Failed to verify admin credentials. Please contact support.',
              ts: Date.now(),
            },
          ],
        };
      }

      const adminUserId = currentUser.id;

      // Update order status to processing
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'processing',
          payment_verified_at: new Date().toISOString(),
          payment_verified_by: adminUserId,
          updated_by: adminUserId, // Track that admin verified payment
        })
        .eq('order_id', orderId);

      if (updateError) {
        console.error('[verifyPayment] Error updating order:', updateError);
        return {
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: 'Failed to verify payment. Please try again.',
              ts: Date.now(),
            },
          ],
        };
      }

      // Create notification for customer about payment verification
      try {
        // Get admin name for the notification
        const { data: adminData } = await supabase
          .from('customer')
          .select('first_name, last_name')
          .eq('customer_id', adminUserId)
          .single();

        const adminName = adminData
          ? `${adminData.first_name || ''} ${adminData.last_name || ''}`.trim() ||
            'Admin'
          : 'Admin';


        // Create notification for customer
        const notification = {
          customer_id: orderDetails.customerId,
          source_type: 'order',
          source_id: orderId,
          title: 'Payment Verified',
          message: `Your payment for order #${orderDetails.displayId} has been verified by ${adminName}. Your order is now being processed.`,
          type: 'success',
          category: 'order',
        };


        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notification);

        if (notifError) {
          console.error(
            '[verifyPayment] Error creating customer notification:',
            notifError
          );
        } else {
        }
      } catch (notifErr) {
        console.error(
          '[verifyPayment] Error in notification creation:',
          notifErr
        );
        // Don't fail the whole action if notifications fail
      }

      // No hardcoded message - let the flow handle the success message

      return {
        messages: [], // No messages - let the flow handle the success message
        context: {
          // Update context with new order status
          order_id: orderDetails.orderId,
          order_status: 'processing',
          payment_verified: true,
          payment_verified_at: new Date().toISOString(),
          payment_verified_by: adminUserId,
        },
      };
    },
    ErrorMessages.PAYMENT_VERIFICATION_FAILED
  );
}
