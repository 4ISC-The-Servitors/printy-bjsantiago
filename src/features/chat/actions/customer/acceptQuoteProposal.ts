/**
 * Action handler: accept_quote_proposal
 *
 * Accepts a quote proposal by updating the quote status to 'accepted'.
 * This action updates only the quotes table (single source of truth for status).
 *
 * @description
 * - Retrieves the conversation ID from session context
 * - Updates quotes status to 'accepted'
 * - Logs the acceptance for audit purposes
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing conversation_id
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Customer performing the action
 *
 * @returns ActionExecutionResult with error message if conversation not found, empty messages otherwise
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "accept_node",
 *   "type": "action",
 *   "action": "accept_quote_proposal",
 *   "action_config": {
 *     "conversation_id_key": "conversation_id"
 *   },
 *   "next": "confirmation_node"
 * }
 * ```
 */
import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function acceptQuoteProposal(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { actionNode, context } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  const config = actionNode.action_config as any;
  const conversationIdKey = config.conversation_id_key || 'conversation_id';
  let conversationId = String(context[conversationIdKey] || '').trim();

  if (!conversationId) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Quote conversation not found. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  // If conversationId is a quote_id, we need to find the actual session_id
  if (conversationId && conversationId.length > 30) {

    // Query quotes table to get the session_id for this quote
    const { data: quoteData } = await supabase
      .from('quotes')
      .select('session_id')
      .eq('quote_id', conversationId)
      .single();

    if (quoteData?.session_id) {
      conversationId = quoteData.session_id;
    } else {
      console.error(
        '[acceptQuoteProposal] No session_id found for quote_id:',
        conversationId
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Quote not found. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }
  }

  try {
    // Update quotes status to 'accepted'

    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
        updated_by: params.customerId, // Track that customer accepted the quote
      })
      .eq('session_id', conversationId)
      .select();


    if (quoteError) {
      console.error('Error updating quotes:', quoteError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error accepting quote. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    if (!quoteData || quoteData.length === 0) {
      console.warn(
        '[acceptQuoteProposal] No quotes found for session_id:',
        conversationId
      );
    }


    // Create notifications for admins
    try {
      // Get customer name for notification message
      const { data: customerData } = await supabase
        .from('customer')
        .select('first_name, last_name')
        .eq('customer_id', params.customerId)
        .single();

      const customerName =
        customerData?.first_name && customerData?.last_name
          ? `${customerData.first_name} ${customerData.last_name}`
          : 'Customer';

      // Get quote display_id for notification
      const quoteDisplayId = quoteData?.[0]?.display_id || 'Unknown';

      // Get all admin users using RPC (bypasses RLS)
      const { data: admins, error: _adminError } = await supabase.rpc(
        'get_admin_customer_ids'
      );


      if (admins && admins.length > 0) {
        // Create notification for each admin
        const notifications = admins.map((admin: { customer_id: string }) => ({
          customer_id: admin.customer_id,
          source_type: 'quote',
          source_id: quoteData?.[0]?.quote_id,
          title: 'Quote Accepted',
          message: `Quote #${quoteDisplayId} was accepted by ${customerName}.`,
          type: 'warning',
          category: 'quote',
        }));


        const { data: _insertedNotifs, error: notifError } = await supabase
          .from('notifications')
          .insert(notifications)
          .select();


        if (notifError) {
          console.error(
            '[AcceptQuote] Error creating admin notifications:',
            notifError
          );
        } else {
        }
      }
    } catch (notifErr) {
      console.error('[AcceptQuote] Error in notification creation:', notifErr);
      // Don't fail the whole action if notifications fail
    }

    // Return success message with End Chat option (branch for valued)
    const contextRoleRaw =
      ((params.context as any)?.customer_type as string | undefined) ||
      ((params.context as any)?.context?.customer_type as string | undefined);
    let customerType = (contextRoleRaw || '').toString();

    if (!customerType && params.customerId) {
      try {
        const { data: cust } = await supabase
          .from('customer')
          .select('customer_type')
          .eq('customer_id', params.customerId)
          .maybeSingle();
        customerType = String((cust?.customer_type as string) || 'regular');
      } catch {
        customerType = 'regular';
      }
    }
    if (!customerType) customerType = 'regular';
    const isValued = customerType.toLowerCase() === 'valued';

    const finalText = isValued
      ? 'Great! You have accepted the quote proposal. Our admin will create your order and it will proceed to processing without upfront payment.'
      : 'Great! You have accepted the quote proposal. Our admin will create your order and you will be instructed to pay for it before your order gets processed.';

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: finalText,
      ts: Date.now(),
    });

    return {
      messages,
      quickReplies: [
        {
          label: 'End Chat',
          value: 'end',
          next: 'end',
        },
      ],
    };
  } catch (error) {
    console.error('Error accepting quote proposal:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Error accepting quote proposal. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
}
