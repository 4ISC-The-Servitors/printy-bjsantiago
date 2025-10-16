/**
 * Action handler: verify_order
 * Verifies that an order exists and belongs to the customer
 */

import { supabase } from '../../../../../lib/supabase';
import type { ActionExecutionParams, ActionExecutionResult } from '../types';

export async function verifyOrder(params: ActionExecutionParams): Promise<ActionExecutionResult> {
  const { actionNode, context, customerId, sessionId } = params;
  const messages: Array<{ id: string; role: 'printy'; text: string; ts: number }> = [];

  const config = actionNode.action_config as any;
  const orderIdKey = config?.order_id_key || 'order_id';
  const orderId = String(context[orderIdKey] || '').trim();

  if (!orderId) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Please provide your Order ID to continue (e.g., ORD-12345).',
      ts: Date.now(),
    });
    return { messages };
  }

  // Lookup order by display_id or order_id UUID belonging to the customer
  let orderRow: any | null = null;
  try {
    // Try match by display_id first (human-friendly like ORD-12345)
    const { data: byDisplay, error: errDisplay } = await supabase
      .from('orders_duplicate')
      .select('order_id, customer_id, status, payment_proof')
      .eq('display_id', orderId)
      .eq('customer_id', customerId)
      .maybeSingle?.() ?? { data: null, error: null } as any;

    if (!errDisplay && byDisplay) {
      orderRow = byDisplay;
    }

    if (!orderRow) {
      // Try match by UUID order_id if user pasted raw UUID
      const { data: byUuid, error: errUuid } = await supabase
        .from('orders_duplicate')
        .select('order_id, customer_id, status, payment_proof')
        .eq('order_id', orderId)
        .eq('customer_id', customerId)
        .maybeSingle?.() ?? { data: null, error: null } as any;

      if (!errUuid && byUuid) {
        orderRow = byUuid;
      }
    }
  } catch (e) {
    // fallthrough
  }

  if (!orderRow) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: "I couldn't find that order under your account. Please double-check the ID or open your Dashboard to copy the Order ID.",
      ts: Date.now(),
    });
    return { messages };
  }

  // Save into session metadata context
  await supabase
    .from('chat_sessions_v2')
    .update({ metadata: { ...context, verified_order_id: orderRow.order_id } as any })
    .eq('session_id', sessionId);

  messages.push({
    id: crypto.randomUUID(),
    role: 'printy',
    text: 'Order verified. You can now upload your payment proof.',
    ts: Date.now(),
  });

  return { messages };
}
