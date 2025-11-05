/**
 * Action handler: create_order
 *
 * Creates an order from an accepted quote proposal.
 * This action is triggered when admin clicks "Create Order" in the admin-create-order flow.
 *
 * @description
 * - Retrieves the accepted quote proposal and specifications
 * - Creates a new order in the orders table with status 'awaiting_payment'
 * - Links the order to the quote, proposal, and session
 * - Generates a display ID for the order
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing quote_id, proposal_id, session_id
 * @param params.sessionId - Current admin chat session ID
 * @param params.customerId - Customer ID (not used in this action)
 *
 * @returns ActionExecutionResult with success message and order details
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "create_order",
 *   "type": "action",
 *   "action": "create_order",
 *   "action_config": {
 *     "conversation_id_key": "session_id"
 *   },
 *   "next": "end"
 * }
 * ```
 *
 * @remarks
 * - Requires quote_id, proposal_id, and session_id in context
 * - Creates order with status 'awaiting_payment'
 * - Links order to quote, proposal, and session for tracking
 */

import { getAdminUserId } from '@features/chat/utils/admin/getAdminUserId';
import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';
import { formatOrderStatus } from '@shared/utils/statusFormatter';

export async function createOrder(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { context, sessionId } = params;

  try {
    // Get required IDs from context
    const quoteId = context.quote_id;
    const proposalId = context.proposal_id;

    if (!quoteId || !proposalId) {
      return {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Missing required information: quote_id or proposal_id not found in context',
            ts: Date.now(),
          },
        ],
      };
    }

    // Get the accepted proposal details
    const { data: proposal, error: proposalError } = await supabase
      .from('quote_proposals')
      .select(
        `
        proposal_id,
        spec_final,
        quoted_price,
        quote_proposals:spec_id (
          spec_data
        )
      `
      )
      .eq('proposal_id', proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error('[createOrder] Error fetching proposal:', proposalError);
      return {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Could not find accepted proposal. Please ensure the proposal was accepted by the customer.',
            ts: Date.now(),
          },
        ],
      };
    }

    // Get customer ID from the quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('customer_id')
      .eq('quote_id', quoteId)
      .single();

    if (quoteError || !quote) {
      console.error('[createOrder] Error fetching quote:', quoteError);
      return {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Could not find quote information.',
            ts: Date.now(),
          },
        ],
      };
    }

    const adminUserId = await getAdminUserId();

    // Determine if customer is VALUED to set initial order status
    let isValuedCustomer = false;
    try {
      const { data: cust } = await supabase
        .from('customer')
        .select('customer_type')
        .eq('customer_id', quote.customer_id)
        .maybeSingle();
      isValuedCustomer = (cust?.customer_type as string) === 'valued';
    } catch {
      // default remains false; treat as regular
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: quote.customer_id,
        quote_id: quoteId,
        proposal_id: proposalId,
        session_id: sessionId,
        order_specs:
          proposal.spec_final ||
          (Array.isArray(proposal.quote_proposals) &&
            proposal.quote_proposals[0]?.spec_data) ||
          {},
        total_amount: proposal.quoted_price,
        status: isValuedCustomer ? 'processing' : 'awaiting_payment',
        updated_by: adminUserId, // Track that admin created the order
        // ✅ FIX: Removed admin_notes - column no longer exists in orders table
      })
      .select('order_id, display_id, total_amount, status')
      .single();

    if (orderError) {
      console.error('[createOrder] Error creating order:', orderError);
      return {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Failed to create order. Please try again.',
            ts: Date.now(),
          },
        ],
      };
    }

    // Update quote status to 'ended' after successful order creation
    // Mark the admin as the actor so DB trigger routes notification to the customer
    const { error: quoteUpdateError } = await supabase
      .from('quotes')
      .update({ status: 'ended', updated_by: adminUserId })
      .eq('quote_id', quoteId);

    if (quoteUpdateError) {
      console.error('[createOrder] Error updating quote status:', quoteUpdateError);
      // Continue execution even if quote status update fails
    }

    return {
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: isValuedCustomer
            ? `Order created successfully!\nOrder ID: ${order.display_id || order.order_id}\nTotal Amount: ₱${Number(order.total_amount).toLocaleString()}\nStatus: ${formatOrderStatus(order.status as string)}\n\nThis order is now being processed immediately for the valued customer.`
            : `Order created successfully!\nOrder ID: ${order.display_id || order.order_id}\nTotal Amount: ₱${Number(order.total_amount).toLocaleString()}\nStatus: ${formatOrderStatus(order.status as string)}\n\nThe customer will now be able to upload their payment proof.`,
          ts: Date.now(),
        },
      ],
    };
  } catch (error) {
    console.error('[createOrder] Unexpected error:', error);
    return {
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'An unexpected error occurred while creating the order.',
          ts: Date.now(),
        },
      ],
    };
  }
}
