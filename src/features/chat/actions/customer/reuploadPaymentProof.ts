/**
 * Action handler: reupload_payment_proof
 *
 * Handles the reuploading of payment proof after admin denial. Similar to
 * processPaymentProofUpload but also clears denial-related fields when updating
 * the order status back to verifying_payment.
 *
 * @description
 * - Receives payment proof URL from context (UI uploads file first)
 * - Validates order exists and belongs to the customer
 * - Updates order record with new payment proof
 * - Sets status back to 'verifying_payment'
 * - Clears payment_denied_at and payment_denied_by fields
 * - Returns success or error message
 *
 * Flow:
 * 1. UI handles file upload to Supabase Storage
 * 2. UI passes storage URL in context as payment_proof_url
 * 3. This action updates the order with the new proof
 * 4. Order moves from 'reupload_payment' status back to 'verifying_payment'
 * 5. Denial fields are cleared so admin can verify again
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing order_id and payment_proof_url
 * @param params.customerId - Customer reuploading the payment proof
 * @param params.sessionId - Current chat session ID
 *
 * @returns ActionExecutionResult with upload status message
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "handle_upload",
 *   "type": "action",
 *   "action": "reupload_payment_proof",
 *   "action_config": {
 *     "order_id_key": "order_id",
 *     "file_key": "payment_proof_file",
 *     "allowed_formats": ["jpg", "jpeg", "png", "pdf"]
 *   },
 *   "next": "success_message"
 * }
 * ```
 *
 * @remarks
 * - File upload to storage happens in UI before calling this action
 * - Only the storage URL is passed to this action
 * - Ensures customer can only update their own orders
 * - Clears denial fields to reset payment verification workflow
 */

import { supabase } from '@lib/supabase';
import {
  withErrorHandling,
  ErrorMessages,
} from '@features/chat/helpers/errorHandling';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';
import { getAllAdminIds } from '@features/chat/utils/admin/getAdminUserId';

export async function reuploadPaymentProof(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  return withErrorHandling(
    'reupload_payment_proof',
    async () => {
      const { actionNode, context, customerId } = params;

      const config = actionNode.action_config as any;
      const orderIdKey = config?.order_id_key || 'order_id';
      const fileKey = config?.file_key || 'payment_proof_file';

      const orderId = String(context[orderIdKey] || '').trim();

      if (!orderId) {
        throw new Error('Order ID is required');
      }

      // Get payment proof URL from context (passed by UI after file upload)
      let paymentProofUrl = (context as any).payment_proof_url || '';

      // Also check the file_key in case UI stores it there
      if (!paymentProofUrl && context[fileKey]) {
        paymentProofUrl = String(context[fileKey]);
      }

      // Check if user input contains a URL (fallback)
      if (!paymentProofUrl && (context as any).user_input) {
        const urlMatch = String((context as any).user_input).match(
          /(https?:\/\/[^\s]+|supabase:\/\/[^\s]+)/
        );
        if (urlMatch) {
          paymentProofUrl = urlMatch[1];
        }
      }

      if (!paymentProofUrl || paymentProofUrl.trim() === '') {
        throw new Error('No payment proof file was uploaded');
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

      // Update order with new payment proof and clear denial fields
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_proof: paymentProofUrl,
          status: 'verifying_payment',
          payment_proof_uploaded_at: new Date().toISOString(),
          payment_denied_at: null,
          payment_denied_by: null,
          updated_at: new Date().toISOString(),
          updated_by: customerId, // Track that customer reuploaded payment proof
        })
        .eq('order_id', orderId)
        .eq('customer_id', customerId);

      if (updateError) {
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      // Create notifications for admins about payment proof reupload
      console.log(
        '[reuploadPaymentProof] Starting notification creation process...'
      );
      try {
        // Get customer name for the notification
        const { data: customerData } = await supabase
          .from('customer')
          .select('first_name, last_name')
          .eq('customer_id', customerId)
          .single();

        const customerName = customerData
          ? `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() ||
            'Customer'
          : 'Customer';

        console.log('[reuploadPaymentProof] Got customer name:', customerName);

        // Get all admin users
        const adminIds = await getAllAdminIds();
        console.log('[reuploadPaymentProof] Got admin IDs:', adminIds);

        if (adminIds.length > 0) {
          // Create notification for each admin
          const notifications = adminIds.map(adminId => ({
            customer_id: adminId,
            source_type: 'order',
            source_id: orderId,
            title: 'Payment Proof Reuploaded',
            message: `Customer ${customerName} reuploaded payment proof for order #${order.display_id}.`,
            type: 'info',
            category: 'order',
          }));

          console.log(
            '[reuploadPaymentProof] Creating admin notifications:',
            notifications
          );

          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications);

          if (notifError) {
            console.error(
              '[reuploadPaymentProof] Error creating admin notifications:',
              notifError
            );
          } else {
            console.log(
              '[reuploadPaymentProof] Created notifications for',
              adminIds.length,
              'admins'
            );
          }
        }
      } catch (notifErr) {
        console.error(
          '[reuploadPaymentProof] Error in notification creation:',
          notifErr
        );
        // Don't fail the whole action if notifications fail
      }

      // Success - no messages, let the flow handle messaging
      return { messages: [] };
    },
    ErrorMessages.PAYMENT_UPLOAD_FAILED
  );
}
