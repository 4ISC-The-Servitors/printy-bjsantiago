/**
 * Action handler: verify_order
 *
 * Verifies that an order exists in the system and belongs to the requesting customer.
 * Supports lookup by both human-friendly display ID (e.g., ORD-12345) and UUID.
 *
 * @description
 * - Accepts order ID from user input (display_id or UUID)
 * - Queries orders table with customer_id verification
 * - Tries display_id match first, then falls back to UUID match
 * - Stores verified_order_id in session metadata for subsequent actions
 * - Returns success or error message based on verification result
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing order_id
 * @param params.customerId - Customer attempting to verify the order
 * @param params.sessionId - Current chat session ID
 *
 * @returns ActionExecutionResult with verification status message
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "verify_order_node",
 *   "type": "action",
 *   "action": "verify_order",
 *   "action_config": {
 *     "order_id_key": "order_id"
 *   },
 *   "next": "upload_proof_node"
 * }
 * ```
 *
 * @remarks
 * - Ensures customer can only access their own orders
 * - Verified order_id is stored in metadata for use by subsequent actions (e.g., upload_payment_proof)
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function verifyOrder(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { actionNode, context, customerId, sessionId } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

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
    const { data: byDisplay, error: errDisplay } =
      (await supabase
        .from('orders')
        .select('order_id, customer_id, status, payment_proof')
        .eq('display_id', orderId)
        .eq('customer_id', customerId)
        .maybeSingle?.()) ?? ({ data: null, error: null } as any);

    if (!errDisplay && byDisplay) {
      orderRow = byDisplay;
    }

    if (!orderRow) {
      // Try match by UUID order_id if user pasted raw UUID
      const { data: byUuid, error: errUuid } =
        (await supabase
          .from('orders')
          .select('order_id, customer_id, status, payment_proof')
          .eq('order_id', orderId)
          .eq('customer_id', customerId)
          .maybeSingle?.()) ?? ({ data: null, error: null } as any);

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
    .update({
      metadata: { ...context, verified_order_id: orderRow.order_id } as any,
    })
    .eq('session_id', sessionId);

  messages.push({
    id: crypto.randomUUID(),
    role: 'printy',
    text: 'Order verified. You can now upload your payment proof.',
    ts: Date.now(),
  });

  return { messages };
}
