/**
 * Helper functions for JsonbFlowProcessor
 */

import type { FlowNode, SessionMetadata } from '@features/chat/types';
import { supabase } from '@lib/supabase';

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
 * Resolve flow owner from a flow definition with a fallback.
 * - Prefer explicit `owner` in the JSON flow definition
 * - Otherwise use provided fallback (e.g., DB column)
 */
export function getFlowOwner(
  flowDefinition: { owner?: 'customer' | 'admin' | 'guest' } | undefined,
  fallback: 'customer' | 'admin' | 'guest' = 'customer'
): 'customer' | 'admin' | 'guest' {
  if (flowDefinition && typeof flowDefinition.owner === 'string') {
    return flowDefinition.owner as any;
  }
  return fallback;
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
    throw new Error(`Failed to insert message: ${error.message}`);
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
 * End a session using ChatEndService for consistent end messages
 * This supersedes any "end" nodes in chat flows
 */
export async function endSession(sessionId: string): Promise<void> {
  try {
    // Get session details to determine user type
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions_v2')
      .select('customer_id, metadata, flow_id')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Failed to fetch session for ending:', sessionError);
      return;
    }

    // Determine user type based on flow_id or metadata
    const isAdminFlow = session.flow_id?.startsWith('admin-') || session.metadata?.admin_chat === true;
    const userType = isAdminFlow ? 'admin' : 'customer';
    const userId = session.customer_id; // Both admin and customer IDs are stored here

    // Use ChatEndService to ensure consistent end messages across all flows
    const { ChatEndService } = await import('@features/chat/services/ChatEndService');
    const result = await ChatEndService.endChatSession({
      sessionId,
      userId,
      userType,
    });

    if (!result.success) {
      console.error('ChatEndService failed to end session:', result.error);
    }
  } catch (error) {
    console.error('Failed to end session:', error);
  }
}

/**
 * Process pending quote actions (accept/reject) after conversation ends
 */
export async function processPendingQuoteAction(
  action: string,
  conversationId: string
): Promise<void> {
  try {
    console.log(
      `[ProcessPendingQuote] Processing ${action} for conversation:`,
      conversationId
    );

    // Get the latest proposal
    const { data: proposals, error: fetchError } = await supabase
      .from('quote_proposals')
      .select('proposal_id, status')
      .eq('session_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error(
        `[ProcessPendingQuote] Error fetching proposal:`,
        fetchError
      );
      return;
    }

    if (!proposals || proposals.length === 0) {
      console.error(
        `[ProcessPendingQuote] No proposals found for conversation:`,
        conversationId
      );
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
      console.error(
        `[ProcessPendingQuote] Error updating proposal status:`,
        proposalError
      );
      return;
    }

    console.log(
      `[ProcessPendingQuote] Proposal status updated to ${newStatus}`
    );

    // Update quote status in quotes table
    console.log(
      `[ProcessPendingQuote] Attempting to update quote status to ${newStatus} for session_id:`,
      conversationId
    );

    const { data: updateResult, error: quoteError } = await supabase
      .from('quotes')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', conversationId)
      .select();

    if (quoteError) {
      console.error(
        `[ProcessPendingQuote] Error updating quote status:`,
        quoteError
      );
    } else {
      console.log(
        `[ProcessPendingQuote] Quote status update result:`,
        updateResult
      );
      console.log(`[ProcessPendingQuote] Quote status updated to ${newStatus}`);
    }
  } catch (error) {
    console.error(
      `[ProcessPendingQuote] Unexpected error processing ${action}:`,
      error
    );
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
