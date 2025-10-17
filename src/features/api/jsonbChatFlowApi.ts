/**
 * JSONB Chat Flow API
 * API functions for the v2 JSONB-based chat flow system
 */

import { supabase } from '../../lib/supabase';
import type { FlowDefinition, SessionMetadata } from '../../chatFlows/types';

export type SenderRole = 'printy' | 'customer' | 'admin';

/**
 * Get flow definition from database
 */
export async function getFlowDefinition(
  flowId: string
): Promise<FlowDefinition | null> {
  const { data, error } = await supabase.rpc('api_get_flow_definition', {
    p_flow_id: flowId,
  });

  if (error) {
    console.error('getFlowDefinition error:', error);
    return null;
  }

  return data as FlowDefinition;
}

/**
 * Create a new chat session
 */
export async function createChatSessionV2(params: {
  flowId: string;
  customerId: string;
  metadata?: Partial<SessionMetadata>;
}): Promise<string | null> {
  const sessionId = crypto.randomUUID();
  
  const { error } = await supabase.from('chat_sessions_v2').insert({
    session_id: sessionId,
    flow_id: params.flowId,
    customer_id: params.customerId,
    status: 'active',
    metadata: params.metadata || {},
  });

  if (error) {
    console.error('createChatSessionV2 error:', error);
    return null;
  }

  return sessionId;
}

/**
 * Insert a message (encrypted)
 */
export async function insertMessageV2(params: {
  sessionId: string;
  text: string;
  role: SenderRole;
  nodeId?: string | null;
}): Promise<{ messageId: string | null }> {
  const { data, error } = await supabase.rpc('api_insert_chat_message_v2', {
    p_session_id: params.sessionId,
    p_text: params.text,
    p_role: params.role,
    p_node_id: params.nodeId || null,
  });

  if (error) {
    console.error('insertMessageV2 error:', error);
    return { messageId: null };
  }

  return { messageId: ((data as any)?.message_id as string) || null };
}

/**
 * Fetch all messages for a session (decrypted)
 */
export async function fetchSessionMessagesV2(
  sessionId: string
): Promise<
  Array<{
    id: string;
    role: SenderRole;
    text: string;
    ts: number;
    nodeId?: string | null;
  }>
> {
  const { data, error } = await supabase.rpc('api_fetch_chat_messages_v2', {
    p_session_id: sessionId,
  });

  if (error) {
    console.error('fetchSessionMessagesV2 error:', error);
    return [];
  }

  return (data as any[]).map(msg => ({
    id: msg.message_id,
    role: msg.sender_role,
    text: msg.message_text,
    ts: new Date(msg.sent_at).getTime(),
    nodeId: msg.node_id,
  }));
}

/**
 * Get session metadata
 */
export async function getSessionMetadata(
  sessionId: string
): Promise<SessionMetadata | null> {
  const { data, error } = await supabase
    .from('chat_sessions_v2')
    .select('metadata')
    .eq('session_id', sessionId)
    .single();

  if (error) {
    console.error('getSessionMetadata error:', error);
    return null;
  }

  return (data?.metadata as SessionMetadata) || null;
}

/**
 * Update session metadata
 */
export async function updateSessionMetadata(
  sessionId: string,
  metadata: SessionMetadata
): Promise<boolean> {
  const { error } = await supabase
    .from('chat_sessions_v2')
    .update({ metadata })
    .eq('session_id', sessionId);

  if (error) {
    console.error('updateSessionMetadata error:', error);
    return false;
  }

  return true;
}

/**
 * End a session
 */
export async function endSessionV2(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('chat_sessions_v2')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId);

  if (error) {
    console.error('endSessionV2 error:', error);
    return false;
  }

  return true;
}

/**
 * Get all user sessions
 */
export async function getUserSessionsV2(): Promise<
  Array<{
    sessionId: string;
    flowId: string;
    status: string;
    createdAt: number;
    currentNodeId: string | null;
  }>
> {
  const { data, error } = await supabase.rpc('api_get_user_sessions_v2');

  if (error) {
    console.error('getUserSessionsV2 error:', error);
    return [];
  }

  return (data as any[]).map(session => ({
    sessionId: session.session_id,
    flowId: session.flow_id,
    status: session.status,
    createdAt: new Date(session.created_at).getTime(),
    currentNodeId: session.current_node_id || null,
  }));
}

/**
 * Get customer ID from session
 */
export async function getSessionCustomerId(
  sessionId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('chat_sessions_v2')
    .select('customer_id')
    .eq('session_id', sessionId)
    .single();

  if (error) {
    console.error('getSessionCustomerId error:', error);
    return null;
  }

  return (data?.customer_id as string) || null;
}

/**
 * Link session to quote conversation
 */
export async function linkSessionToQuote(params: {
  sessionId: string;
  quoteConversationId: string;
}): Promise<boolean> {
  const metadata = await getSessionMetadata(params.sessionId);
  
  if (!metadata) {
    return false;
  }

  metadata.quote_conversation_id = params.quoteConversationId;

  return await updateSessionMetadata(params.sessionId, metadata);
}

/**
 * Link session to inquiry
 */
export async function linkSessionToInquiry(params: {
  sessionId: string;
  inquiryId: string;
}): Promise<boolean> {
  const metadata = await getSessionMetadata(params.sessionId);
  
  if (!metadata) {
    return false;
  }

  metadata.inquiry_id = params.inquiryId;

  return await updateSessionMetadata(params.sessionId, metadata);
}

