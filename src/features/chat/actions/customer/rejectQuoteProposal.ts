/**
 * Action handler: reject_quote_proposal
 *
 * Rejects a quote proposal by updating the quote status to 'rejected'.
 * This action updates only the quotes table (single source of truth for status).
 *
 * @description
 * - Retrieves the conversation ID from session context
 * - Updates quotes status to 'rejected'
 * - Logs the rejection for audit purposes
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
 *   "id": "reject_node",
 *   "type": "action",
 *   "action": "reject_quote_proposal",
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

export async function rejectQuoteProposal(
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
        '[rejectQuoteProposal] No session_id found for quote_id:',
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
    // Update quotes status to 'rejected'
    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
        updated_by: params.customerId, // Track that customer rejected the quote
      })
      .eq('session_id', conversationId)
      .select();


    if (quoteError) {
      console.error('Error updating quotes:', quoteError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error rejecting quote. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    if (!quoteData || quoteData.length === 0) {
      console.warn(
        '[rejectQuoteProposal] No quotes found for session_id:',
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
      const { data: admins } = await supabase.rpc(
        'get_admin_customer_ids'
      );

      if (admins && admins.length > 0) {
        // Create notification for each admin
        const notifications = admins.map((admin: { customer_id: string }) => ({
          customer_id: admin.customer_id,
          source_type: 'quote',
          source_id: quoteData?.[0]?.quote_id,
          title: 'Quote Rejected',
          message: `Quote #${quoteDisplayId} was rejected by ${customerName}.`,
          type: 'warning',
          category: 'quote',
        }));

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications)
          .select();

        if (notifError) {
          console.error(
            '[RejectQuote] Error creating admin notifications:',
            notifError
          );
        } else {
          // Notifications created successfully
        }
      }
    } catch (notifErr) {
      console.error('[RejectQuote] Error in notification creation:', notifErr);
      // Don't fail the whole action if notifications fail
    }

    // Return rejection message with End Chat option
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'You have rejected the quote proposal. If you would like to request a new quote or discuss modifications, please start a new quote request or contact our admin team. Thank you for considering B.J. Santiago!',
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
    console.error('Error rejecting quote proposal:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Error rejecting quote proposal. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
}
