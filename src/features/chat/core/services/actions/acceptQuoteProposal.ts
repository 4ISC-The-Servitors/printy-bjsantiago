/**
 * Action handler: accept_quote_proposal
 * Queues a quote proposal acceptance (actual update happens after acknowledgement)
 */

import { supabase } from '../../../../../lib/supabase';
import { updateSessionMetadata } from '../helpers/flowHelpers';
import type { ActionExecutionParams, ActionExecutionResult } from '../types';
import type { SessionMetadata } from '../../../../../chatFlows/types';

export async function acceptQuoteProposal(params: ActionExecutionParams): Promise<ActionExecutionResult> {
  const { actionNode, context, sessionId } = params;
  const messages: Array<{ id: string; role: 'printy'; text: string; ts: number }> = [];

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

  console.log('[AcceptQuote] Current session metadata before update:', currentSession?.metadata);

  if (currentSession) {
    const currentMetadata = currentSession.metadata as SessionMetadata;
    const updatedMetadata = {
      ...currentMetadata,
      context: {
        ...currentMetadata.context,
        ...context,
        pending_quote_action: 'accept',
        pending_conversation_id: conversationId,
      },
    };

    console.log('[AcceptQuote] Updated metadata to save:', updatedMetadata);

    await updateSessionMetadata(sessionId, updatedMetadata);

    // Verify the update
    const { data: verifySession } = await supabase
      .from('chat_sessions_v2')
      .select('metadata')
      .eq('session_id', sessionId)
      .single();
    console.log('[AcceptQuote] Metadata after update:', verifySession?.metadata);
  }

  console.log('[AcceptQuote] Quote acceptance queued for conversation:', conversationId);

  return { messages };
}
