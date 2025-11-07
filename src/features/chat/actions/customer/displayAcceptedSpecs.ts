import { supabase } from '@lib/supabase';
import type { ActionHandler } from '@features/chat/types';
import {
  buildSpecHeaderLines,
  buildSpecDetailLines,
} from '@features/chat/helpers/specDisplay';

export const displayAcceptedSpecs: ActionHandler = async ({
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

    // Fetch order details to get proposal_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_id, display_id, proposal_id, total_amount, status')
      .eq('order_id', orderId)
      .eq('customer_id', customerId)
      .single();

    if (orderError || !order) {
      console.error('[displayAcceptedSpecs] Error fetching order:', orderError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error: Order not found or you do not have permission to view this order.',
        ts: Date.now(),
      });
      return { messages };
    }

    if (!order.proposal_id) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error: No proposal found for this order.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Fetch the accepted proposal specs
    const { data: proposal, error: proposalError } = await supabase
      .from('quote_proposals')
      .select(
        `
        proposal_id,
        spec_id,
        spec_final,
        quoted_price,
        notes,
        created_at
      `
      )
      .eq('proposal_id', order.proposal_id)
      .single();

    if (proposalError || !proposal) {
      console.error(
        '[displayAcceptedSpecs] Error fetching proposal:',
        proposalError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error: Accepted proposal not found for this order.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Format the specs message
    const specLines: string[] = [
      'Here are the accepted specifications for your order:',
      '',
    ];

    // Try to get specs from spec_final first, then from quote_specs table
    let specs: any = null;

    if (proposal.spec_final) {
      specs = proposal.spec_final;
    } else if (proposal.spec_id) {
      // Fetch from quote_specs table
      const { data: specData, error: specError } = await supabase
        .from('quote_specs')
        .select('spec_data')
        .eq('spec_id', proposal.spec_id)
        .single();

      if (specData && !specError) {
        specs = specData.spec_data;
      }
    }

    if (specs) {
      const normalizedSpecs = { ...specs } as any;
      if (!normalizedSpecs.product_name && normalizedSpecs.product) {
        normalizedSpecs.product_name = normalizedSpecs.product;
      }

      const adminNotes =
        normalizedSpecs.admin_notes || proposal.notes || undefined;

      try {
        const headerLines = await buildSpecHeaderLines({
          service_id: normalizedSpecs?.service_id,
          category: normalizedSpecs?.category,
        });
        const detailLines = buildSpecDetailLines(normalizedSpecs, adminNotes);

        if (headerLines.length > 0) {
          specLines.push(...headerLines);
        }

        if (detailLines.length > 0) {
          specLines.push(...detailLines);
        }

        if (specLines.length <= 2) {
          specLines.push(
            'Specifications are available but in a different format.'
          );
        }
      } catch (parseError) {
        console.error(
          '[displayAcceptedSpecs] Error parsing specs:',
          parseError
        );
        specLines.push(
          'Specifications data is available but cannot be displayed in detail.'
        );
      }
    } else {
      specLines.push('No detailed specifications available.');
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: specLines.join('\n'),
      ts: Date.now(),
    });

    return { messages };
  } catch (error) {
    console.error('[displayAcceptedSpecs] Error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Sorry, there was an error retrieving your order specifications. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
};
