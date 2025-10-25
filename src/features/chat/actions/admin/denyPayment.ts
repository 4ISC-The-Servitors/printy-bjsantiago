/**
 * Action handler: deny_payment
 *
 * Denies a customer's payment proof and updates the order status to 'reupload_payment'.
 * Stores the denial reason in both the orders table and session metadata.
 *
 * @description
 * - Updates order status to 'reupload_payment'
 * - Stores denial reason in orders.denial_reason column (for customer RLS access)
 * - Stores denial reason in session metadata as 'admin_denial_message'
 * - Records payment_denied_at timestamp and payment_denied_by admin ID
 * - Returns context updates for SessionStateManager batching
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing order_id and denial_reason
 * @param params.sessionId - Current admin chat session ID
 *
 * @returns ActionExecutionResult with denial confirmation
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "deny_payment",
 *   "type": "action",
 *   "action": "deny_payment",
 *   "action_config": {
 *     "order_id_key": "order_id",
 *     "denial_reason_key": "denial_reason"
 *   },
 *   "next": "denied_confirmation"
 * }
 * ```
 *
 * @remarks
 * - Requires order_id and denial_reason in context
 * - Uses standardized error handling
 * - Stores denial_reason in orders table so customer can access via RLS policies
 * - Also stores in session metadata for admin reference
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

export async function denyPayment(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  return withErrorHandling(
    'deny_payment',
    async () => {
      const { actionNode, context } = params;

      const config = actionNode.action_config as any;
      const orderIdKey = config?.order_id_key || 'order_id';
      const denialReasonKey = config?.denial_reason_key || 'denial_reason';
      const orderId = String(context[orderIdKey] || '').trim();
      const denialReason = String(context[denialReasonKey] || '').trim();

      // Validate required context
      const validationError = validateRequiredContext(
        { [orderIdKey]: orderId, [denialReasonKey]: denialReason },
        [orderIdKey, denialReasonKey],
        'deny_payment'
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

      // Verify order is in correct status for denial
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
        console.error('[denyPayment] Error getting current user:', userError);
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

      // Update order status to reupload_payment and store denial reason
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'reupload_payment',
          payment_denied_at: new Date().toISOString(),
          payment_denied_by: adminUserId,
          denial_reason: denialReason, // Store denial reason in orders table for customer access
          updated_by: adminUserId, // Track that admin denied payment
        })
        .eq('order_id', orderId);

      if (updateError) {
        console.error('[denyPayment] Error updating order:', updateError);
        return {
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: 'Failed to update order status. Please try again.',
              ts: Date.now(),
            },
          ],
        };
      }

      // Create notification for customer about payment denial
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
          title: 'Payment Denied',
          message: `Your payment for order #${orderDetails.displayId} was denied by ${adminName}. Reason: ${denialReason}. Please upload a new payment proof.`,
          type: 'warning',
          category: 'order',
        };


        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notification);

        if (notifError) {
          console.error(
            '[denyPayment] Error creating customer notification:',
            notifError
          );
        } else {
        }
      } catch (notifErr) {
        console.error(
          '[denyPayment] Error in notification creation:',
          notifErr
        );
        // Don't fail the whole action if notifications fail
      }

      // No hardcoded message - let the flow handle the denial message

      return {
        messages: [], // No messages - let the flow handle the denial message
        context: {
          // Update context with new order status
          order_id: orderDetails.orderId,
          order_status: 'reupload_payment',
          payment_denied: true,
          payment_denied_at: new Date().toISOString(),
          payment_denied_by: adminUserId,
          denial_reason: denialReason,
          // Store in session metadata for customer access
          admin_denial_message: denialReason,
        },
      };
    },
    ErrorMessages.PAYMENT_VERIFICATION_FAILED
  );
}
