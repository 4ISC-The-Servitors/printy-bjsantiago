/**
 * Action handler: reject_quote_proposal
 *
 * Rejects a quote proposal by updating the database status to 'Rejected'.
 * This action immediately updates both quote_proposals and quotes tables.
 *
 * @description
 * - Retrieves the conversation ID from session context
 * - Updates quote_proposals status to 'Rejected'
 * - Updates quotes status to 'Rejected'
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
  console.log('[rejectQuoteProposal] Action called with params:', params);
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
    console.log(
      '[rejectQuoteProposal] conversationId looks like quote_id, finding session_id...'
    );

    // Query quotes table to get the session_id for this quote
    const { data: quoteData } = await supabase
      .from('quotes')
      .select('session_id')
      .eq('quote_id', conversationId)
      .single();

    if (quoteData?.session_id) {
      conversationId = quoteData.session_id;
      console.log('[rejectQuoteProposal] Found session_id:', conversationId);
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
    // Update quote_proposals status to 'rejected'
    const { error: proposalError } = await supabase
      .from('quote_proposals')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', conversationId);

    if (proposalError) {
      console.error('Error updating quote_proposals:', proposalError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error rejecting quote proposal. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Update quotes status to 'rejected'
    const { error: quoteError } = await supabase
      .from('quotes')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', conversationId);

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

    console.log(
      '[RejectQuote] Quote proposal rejected for conversation:',
      conversationId
    );

    // Return empty messages - the flow processor will handle the confirmation message
    return { messages: [] };
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
