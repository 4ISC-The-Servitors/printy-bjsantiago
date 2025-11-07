/**
 * Action handler: change_order_status
 *
 * Allows admins to transition order statuses after payment verification.
 * Supports valued customer flow where orders can move to awaiting payment
 * before final fulfillment statuses.
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
import { formatOrderStatus } from '@shared/utils/statusFormatter';

const ORDER_STATUS_ACTION = 'change_order_status';

const BASE_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  processing: ['for_delivery', 'for_pickup', 'completed'],
  for_delivery: ['completed'],
  for_pickup: ['completed'],
};

function isValuedCustomer(type: string | undefined): boolean {
  return type?.toLowerCase() === 'valued';
}

function getAllowedTargets(
  currentStatus: string,
  customerType: string
): string[] {
  const baseTargets = BASE_ALLOWED_TRANSITIONS[currentStatus] || [];

  if (currentStatus === 'processing' && isValuedCustomer(customerType)) {
    return [...baseTargets, 'awaiting_payment'];
  }

  return baseTargets;
}

export async function changeOrderStatus(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  return withErrorHandling(
    ORDER_STATUS_ACTION,
    async () => {
      const { context, actionNode } = params;

      const config = (actionNode.action_config as any) || {};
      const orderIdKey = config.order_id_key || 'order_id';
      const nextStatusKey = config.next_status_key || 'next_order_status';

      const orderId = String(context[orderIdKey] || '').trim();
      const requestedStatusRaw = String(context[nextStatusKey] || '').trim();
      const requestedStatus = requestedStatusRaw.toLowerCase();

      const validationError = validateRequiredContext(
        { [orderIdKey]: orderId, [nextStatusKey]: requestedStatus },
        [orderIdKey, nextStatusKey],
        ORDER_STATUS_ACTION
      );
      if (validationError) {
        return validationError;
      }

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

      const currentStatus = String(orderDetails.status || '').toLowerCase();

      if (currentStatus === requestedStatus) {
        return {
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: 'Order is already in the selected status.',
              ts: Date.now(),
            },
          ],
        };
      }

      let customerType = String(context.customer_type || '').toLowerCase();

      if (!customerType) {
        const { data: customerRow } = await supabase
          .from('customer')
          .select('customer_type')
          .eq('customer_id', orderDetails.customerId)
          .single();

        customerType = String(
          customerRow?.customer_type || 'regular'
        ).toLowerCase();
      }

      const allowedTargets = getAllowedTargets(currentStatus, customerType);

      if (!allowedTargets.includes(requestedStatus)) {
        const formattedTargets = allowedTargets
          .map(target => formatOrderStatus(target))
          .join(', ');

        return {
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text:
                formattedTargets.length > 0
                  ? `Invalid status selected. Allowed transitions from ${formatOrderStatus(currentStatus)}: ${formattedTargets}.`
                  : 'No status transitions are available from the current status.',
              ts: Date.now(),
            },
          ],
        };
      }

      if (
        requestedStatus === 'awaiting_payment' &&
        !isValuedCustomer(customerType)
      ) {
        return {
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: 'Awaiting Payment can only be set for valued customers.',
              ts: Date.now(),
            },
          ],
        };
      }

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        console.error(
          '[changeOrderStatus] Error getting current user:',
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

      const updatePayload: Record<string, unknown> = {
        status: requestedStatus,
        updated_by: adminUserId,
      };

      if (requestedStatus === 'completed') {
        updatePayload.completed_at = new Date().toISOString();
      }

      if (requestedStatus !== 'completed' && currentStatus === 'completed') {
        updatePayload.completed_at = null;
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('order_id', orderId);

      if (updateError) {
        console.error('[changeOrderStatus] Error updating order:', updateError);
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

      return {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'printy',
            text: `Order status updated to: ${formatOrderStatus(requestedStatus)}.`,
            ts: Date.now(),
          },
        ],
        context: {
          order_id: orderDetails.orderId,
          order_status: requestedStatus,
          customer_type: customerType,
        },
      };
    },
    'Failed to update order status. Please try again.'
  );
}
