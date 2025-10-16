/**
 * Action handler: upload_payment_proof
 * Handles uploading payment proof for an order
 */

import { supabase } from '../../../../../../lib/supabase';
import type { ActionExecutionParams, ActionExecutionResult } from '../../types';

export async function uploadPaymentProof(params: ActionExecutionParams): Promise<ActionExecutionResult> {
  const { actionNode, context, customerId } = params;
  const messages: Array<{ id: string; role: 'printy'; text: string; ts: number }> = [];

  const config = actionNode.action_config as any;
  const orderIdKey = config?.order_id_key || 'order_id';
  const fileKey = config?.file_key || 'payment_proof_file';
  const orderIdInput = String(context[orderIdKey] || '').trim();
  const fileRef = String(context[fileKey] || '').trim();

  // We expect the chat UI to upload to Supabase Storage first and pass a storage URL reference
  // Example formats we support:
  // - supabase://payment-proofs/<customerId>/<filename>
  // - https://<project>.supabase.co/storage/v1/object/sign/payment-proofs/<path>
  const looksLikeProof = /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|pdf)/i.test(fileRef)
    || /^https?:\/\/.*supabase\.co.*payment-proofs/i.test(fileRef)
    || /^supabase:\/\/payment-proofs\//i.test(fileRef);

  if (!looksLikeProof) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Please upload a valid payment proof file before continuing.',
      ts: Date.now(),
    });
    return { messages };
  }

  // Resolve the order to update
  let resolvedOrderId: string | null = null;
  if ((context as any).verified_order_id) {
    resolvedOrderId = String((context as any).verified_order_id);
  }

  if (!resolvedOrderId && orderIdInput) {
    // Try to resolve using provided order input (display_id or UUID)
    try {
      const { data: byDisplay } = await supabase
        .from('orders_duplicate')
        .select('order_id')
        .eq('display_id', orderIdInput)
        .eq('customer_id', customerId)
        .maybeSingle?.() as any;
      if (byDisplay?.order_id) resolvedOrderId = byDisplay.order_id;
    } catch {}

    if (!resolvedOrderId) {
      try {
        const { data: byUuid } = await supabase
          .from('orders_duplicate')
          .select('order_id')
          .eq('order_id', orderIdInput)
          .eq('customer_id', customerId)
          .maybeSingle?.() as any;
        if (byUuid?.order_id) resolvedOrderId = byUuid.order_id;
      } catch {}
    }
  }

  if (!resolvedOrderId) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'I could not resolve your order. Please provide the correct Order ID first.',
      ts: Date.now(),
    });
    return { messages };
  }

  // Update order with payment proof reference and set status to verifying
  const { error: updateError } = await supabase
    .from('orders_duplicate')
    .update({
      payment_proof: fileRef,
      payment_proof_uploaded_at: new Date().toISOString(),
      status: 'verifying_payment',
    })
    .eq('order_id', resolvedOrderId)
    .eq('customer_id', customerId);

  if (updateError) {
    console.error('Error updating order with payment proof:', updateError);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Failed to record your payment proof. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  messages.push({
    id: crypto.randomUUID(),
    role: 'printy',
    text: 'Your payment proof has been received. Our team will verify it shortly. You will get an update once confirmed.',
    ts: Date.now(),
  });

  return { messages };
}
