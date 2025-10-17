/**
 * Action handler: reject_quote_proposal
 *
 * Queues a quote proposal rejection for processing after user acknowledgement.
 * This action stores the rejection intent in session metadata as a pending action,
 * which will be processed when the conversation ends.
 *
 * @description
 * - Retrieves the conversation ID from session context
 * - Stores 'pending_quote_action: reject' in session metadata
 * - Actual database update happens after user acknowledges the rejection
 * - Updates both quote_proposals and quotes tables
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
import { updateSessionMetadata } from '@features/chat/helpers/flowHelpers';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';
import type { SessionMetadata } from '@features/chat/types';

export async function rejectQuoteProposal(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { actionNode, context, sessionId } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  // Store the conversation ID for later database update
  const config = actionNode.action_config as any;
  const conversationIdKey = config.conversation_id_key || 'conversation_id';
  const conversationId = String(context[conversationIdKey] || '').trim();

  if (!conversationId) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Quote conversation not found. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  // Get current metadata and update context
  const { data: currentSession } = await supabase
    .from('chat_sessions_v2')
    .select('metadata')
    .eq('session_id', sessionId)
    .single();

  console.log(
    '[RejectQuote] Current session metadata before update:',
    currentSession?.metadata
  );

  if (currentSession) {
    const currentMetadata = currentSession.metadata as SessionMetadata;
    const updatedMetadata = {
      ...currentMetadata,
      context: {
        ...currentMetadata.context,
        ...context,
        pending_quote_action: 'reject',
        pending_conversation_id: conversationId,
      },
    };

    console.log('[RejectQuote] Updated metadata to save:', updatedMetadata);

    await updateSessionMetadata(sessionId, updatedMetadata);

    // Verify the update
    const { data: verifySession } = await supabase
      .from('chat_sessions_v2')
      .select('metadata')
      .eq('session_id', sessionId)
      .single();
    console.log(
      '[RejectQuote] Metadata after update:',
      verifySession?.metadata
    );
  }

  console.log(
    '[RejectQuote] Quote rejection queued for conversation:',
    conversationId
  );

  return { messages };
}
