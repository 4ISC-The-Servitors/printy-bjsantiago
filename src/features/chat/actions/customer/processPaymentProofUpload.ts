import { supabase } from '@lib/supabase';
import type { ActionHandler } from '@features/chat/types';
import { getAllAdminIds } from '@features/chat/utils/admin/getAdminUserId';

export const processPaymentProofUpload: ActionHandler = async ({
  customerId,
  context,
}) => {
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  try {
    const orderId = context.order_id;

    if (!orderId) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error: No order ID provided. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Get payment proof URL from context (passed by UI after file upload)
    let paymentProofUrl = context.payment_proof_url;

    // If no URL in context, check if user input contains a URL
    if (!paymentProofUrl && context.user_input) {
      const urlMatch = context.user_input.match(
        /(https?:\/\/[^\s]+|supabase:\/\/[^\s]+)/
      );
      if (urlMatch) {
        paymentProofUrl = urlMatch[1];
      }
    }

    if (!paymentProofUrl) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'No payment proof file was uploaded. Please try uploading your payment proof again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Check if order exists and is in awaiting_payment status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_id, display_id, status, customer_id')
      .eq('order_id', orderId)
      .eq('customer_id', customerId)
      .single();

    if (orderError || !order) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error: Order not found or you do not have permission to upload payment for this order.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Update order with payment proof URL and change status to verifying_payment
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_proof: paymentProofUrl,
        status: 'verifying_payment',
        payment_proof_uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: customerId, // Track that customer uploaded payment proof
      })
      .eq('order_id', orderId);

    if (updateError) {
      console.error(
        '[processPaymentProofUpload] Error updating order:',
        updateError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Sorry, there was an error processing your payment proof. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Create notifications for admins about payment proof upload
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


      // Get all admin users
      const adminIds = await getAllAdminIds();

      if (adminIds.length > 0) {
        // Create notification for each admin
        const notifications = adminIds.map(adminId => ({
          customer_id: adminId,
          source_type: 'order',
          source_id: orderId,
          title: 'Payment Proof Uploaded',
          message: `Customer ${customerName} uploaded payment proof for order #${order.display_id}.`,
          type: 'info',
          category: 'order',
        }));


        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error(
            '[processPaymentProofUpload] Error creating admin notifications:',
            notifError
          );
        } else {
        }
      }
    } catch (notifErr) {
      console.error(
        '[processPaymentProofUpload] Error in notification creation:',
        notifErr
      );
      // Don't fail the whole action if notifications fail
    }

    // Don't add success message here - let the payment_uploaded node handle it
    // This prevents duplicate messages

    return { messages };
  } catch (error) {
    console.error('[processPaymentProofUpload] Error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Sorry, there was an error uploading your payment proof. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
};
