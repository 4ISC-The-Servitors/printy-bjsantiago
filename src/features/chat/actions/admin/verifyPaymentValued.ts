/**
 * Action handler: verify_payment_valued
 *
 * Verifies a valued customer's payment proof and updates the order status to 'for_pickup' or 'for_delivery'.
 * Sets verification timestamps and admin user information.
 *
 * @description
 * - Verifies payment (sets payment_verified_at, payment_verified_by)
 * - Updates order status to 'for_pickup' or 'for_delivery' (based on admin selection)
 * - Returns context updates for SessionStateManager batching
 * - Provides confirmation message to admin
 * - Triggers two notifications: payment verification and order status update
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing order_id and delivery_method
 * @param params.sessionId - Current admin chat session ID
 * @param params.customerId - Not used (admin action)
 *
 * @returns ActionExecutionResult with verification confirmation
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "verify_payment_valued",
 *   "type": "action",
 *   "action": "verify_payment_valued",
 *   "action_config": {
 *     "order_id_key": "order_id",
 *     "delivery_method_key": "delivery_method"
 *   },
 *   "next": "verified_confirmation"
 * }
 * ```
 *
 * @remarks
 * - Requires order_id in context
 * - Requires delivery_method in context ('pickup' or 'delivery')
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

export async function verifyPaymentValued(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  return withErrorHandling(
    'verify_payment_valued',
    async () => {
      const { actionNode, context } = params;

      const config = actionNode.action_config as any;
      const orderIdKey = config?.order_id_key || 'order_id';
      const deliveryMethodKey =
        config?.delivery_method_key || 'delivery_method';
      const orderId = String(context[orderIdKey] || '').trim();
      const deliveryMethod = String(context[deliveryMethodKey] || '')
        .trim()
        .toLowerCase();

      // Validate required context
      const validationError = validateRequiredContext(
        { [orderIdKey]: orderId, [deliveryMethodKey]: deliveryMethod },
        [orderIdKey, deliveryMethodKey],
        'verify_payment_valued'
      );
      if (validationError) {
        return validationError;
      }

      // Validate delivery method
      if (deliveryMethod !== 'pickup' && deliveryMethod !== 'delivery') {
        return {
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: 'Invalid delivery method. Please select either "pickup" or "delivery".',
              ts: Date.now(),
            },
          ],
        };
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

      // Verify customer is valued
      const { data: customerData, error: customerError } = await supabase
        .from('customer')
        .select('customer_type')
        .eq('customer_id', orderDetails.customerId)
        .single();

      if (customerError || !customerData) {
        return {
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: 'Failed to verify customer information. Please try again.',
              ts: Date.now(),
            },
          ],
        };
      }

      const customerType = String(
        customerData.customer_type || ''
      ).toLowerCase();
      if (customerType !== 'valued') {
        return {
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: 'This action is only for valued customers. Please use the regular verify payment flow.',
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
        console.error(
          '[verifyPaymentValued] Error getting current user:',
          userError
        );
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

      // Determine new status based on delivery method
      const newStatus =
        deliveryMethod === 'pickup' ? 'for_pickup' : 'for_delivery';

      // Update order: verify payment AND set status to for_pickup/for_delivery in one update
      // This will trigger the notification function which should send both notifications
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          payment_verified_at: new Date().toISOString(),
          payment_verified_by: adminUserId,
          updated_by: adminUserId, // Track that admin verified payment
        })
        .eq('order_id', orderId);

      if (updateError) {
        console.error(
          '[verifyPaymentValued] Error updating order:',
          updateError
        );
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

      // Notifications are handled by database trigger (notify_order_events)
      // The trigger will send both payment verification and order update notifications

      return {
        messages: [], // No messages - let the flow handle the success message
        context: {
          // Update context with new order status
          order_id: orderDetails.orderId,
          order_status: newStatus,
          payment_verified: true,
          payment_verified_at: new Date().toISOString(),
          payment_verified_by: adminUserId,
          delivery_method: deliveryMethod,
        },
      };
    },
    ErrorMessages.PAYMENT_VERIFICATION_FAILED
  );
}
