/**
 * Helper functions for JsonbFlowProcessor
 */

import type { FlowNode, SessionMetadata } from '../../../../../chatFlows/types';
import { supabase } from '../../../../../lib/supabase';

/**
 * Build quick replies from node
 */
export function buildQuickReplies(node: FlowNode): Array<{
  id: string;
  label: string;
  value: string;
}> {
  if (node.type === 'message' && node.options) {
    return node.options.map((opt, i) => ({
      id: `qr-${i}`,
      label: opt.label,
      value: opt.label,
    }));
  }

  if (node.type === 'action' && node.options) {
    return node.options.map((opt, i) => ({
      id: `qr-${i}`,
      label: opt.label,
      value: opt.label,
    }));
  }

  // Default quick reply
  return [{ id: 'qr-end', label: 'End Chat', value: 'End Chat' }];
}

/**
 * Insert a message to chat_messages_v2
 */
export async function insertMessage(params: {
  sessionId: string;
  text: string;
  role: 'customer' | 'admin' | 'printy';
  nodeId?: string;
}): Promise<void> {
  // Note: This should use the RPC function to encrypt the message
  // For now, using a placeholder - you'll need to implement api_insert_chat_message_v2
  const { error } = await supabase.rpc('api_insert_chat_message_v2', {
    p_session_id: params.sessionId,
    p_text: params.text,
    p_role: params.role,
    p_node_id: params.nodeId || null,
  });

  if (error) {
    console.error('Failed to insert message:', error);
  }
}

/**
 * Update session metadata
 */
export async function updateSessionMetadata(
  sessionId: string,
  metadata: SessionMetadata
): Promise<void> {
  const { error } = await supabase
    .from('chat_sessions_v2')
    .update({ metadata })
    .eq('session_id', sessionId);

  if (error) {
    console.error('Failed to update session metadata:', error);
  }
}

/**
 * End a session
 */
export async function endSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_sessions_v2')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId);

  if (error) {
    console.error('Failed to end session:', error);
  }
}

/**
 * Process pending quote actions (accept/reject) after conversation ends
 */
export async function processPendingQuoteAction(action: string, conversationId: string): Promise<void> {
  try {
    console.log(`[ProcessPendingQuote] Processing ${action} for conversation:`, conversationId);

    // Get the latest proposal
    const { data: proposals, error: fetchError } = await supabase
      .from('quote_proposals')
      .select('proposal_id, status')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error(`[ProcessPendingQuote] Error fetching proposal:`, fetchError);
      return;
    }

    if (!proposals || proposals.length === 0) {
      console.error(`[ProcessPendingQuote] No proposals found for conversation:`, conversationId);
      return;
    }

    const proposal = proposals[0];
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    // Update the proposal status
    const { error: proposalError } = await supabase
      .from('quote_proposals')
      .update({ status: newStatus })
      .eq('proposal_id', proposal.proposal_id);

    if (proposalError) {
      console.error(`[ProcessPendingQuote] Error updating proposal status:`, proposalError);
      return;
    }

    console.log(`[ProcessPendingQuote] Proposal status updated to ${newStatus}`);

    // Update conversation status
    console.log(`[ProcessPendingQuote] Attempting to update conversation status to ${newStatus} for conversation_id:`, conversationId);

    const { data: updateResult, error: conversationError } = await supabase
      .from('quote_conversations')
      .update({ status: newStatus })
      .eq('conversation_id', conversationId)
      .select();

    if (conversationError) {
      console.error(`[ProcessPendingQuote] Error updating conversation status:`, conversationError);
    } else {
      console.log(`[ProcessPendingQuote] Conversation status update result:`, updateResult);
      console.log(`[ProcessPendingQuote] Conversation status updated to ${newStatus}`);
    }

  } catch (error) {
    console.error(`[ProcessPendingQuote] Unexpected error processing ${action}:`, error);
  }
}

/**
 * Fetch all messages for a session
 */
export async function fetchSessionMessages(sessionId: string): Promise<
  Array<{
    id: string;
    role: 'customer' | 'admin' | 'printy';
    text: string;
    ts: number;
  }>
> {
  // Note: This should use the RPC function to decrypt messages
  // For now, using a placeholder - you'll need to implement api_fetch_chat_messages_v2
  const { data, error } = await supabase.rpc('api_fetch_chat_messages_v2', {
    p_session_id: sessionId,
  });

  if (error) {
    console.error('Failed to fetch messages:', error);
    return [];
  }

  return (data as any[]).map((msg: any) => ({
    id: msg.message_id,
    role: msg.sender_role,
    text: msg.message_text,
    ts: new Date(msg.sent_at).getTime(),
  }));
}
