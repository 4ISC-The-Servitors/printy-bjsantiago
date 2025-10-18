import { supabase } from '@lib/supabase';
import type { ActionHandler } from '@features/chat/types';

export const displayOrderPaymentInfo: ActionHandler = async ({
  customerId,
  context,
}) => {
  console.log('[displayOrderPaymentInfo] Action called');
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

    // Fetch order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('order_id, display_id, total_amount, status, created_at')
      .eq('order_id', orderId)
      .eq('customer_id', customerId)
      .single();

    if (error || !order) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error: Order not found or you do not have permission to view this order.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Check if order is in awaiting_payment status
    if (order.status !== 'awaiting_payment') {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: `This order (${order.display_id}) is currently in "${order.status}" status and cannot be paid at this time.`,
        ts: Date.now(),
      });
      return { messages };
    }

    // Format the payment info message
    const paymentInfo = `Your total balance for ${order.display_id} is ₱${parseFloat(order.total_amount).toFixed(2)}.`;
    console.log('[displayOrderPaymentInfo] Pushing message:', paymentInfo);
    
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: paymentInfo,
      ts: Date.now(),
    });

    console.log('[displayOrderPaymentInfo] Returning messages:', messages.length);
    return { messages };
  } catch (error) {
    console.error('[displayOrderPaymentInfo] Error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Sorry, there was an error retrieving your order information. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
};
