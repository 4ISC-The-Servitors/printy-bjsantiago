import { supabase } from '../../lib/supabase';

export type SenderRole = 'printy' | 'customer' | 'admin';

export interface DbFlowNode {
  node_id: string;
  flow_id: string;
  node_type: 'start' | 'message' | 'end';
  text: string;
  is_initial: boolean;
  // Optional action fields (see 013_alter_chat_flow_for_issue_ticket.sql)
  node_action?:
    | 'none'
    | 'expects_input'
    | 'set_context'
    | 'lookup_order'
    | 'list_recent_orders'
    | 'create_inquiry'
    | 'ticket_status_query';
  action_config?: Record<string, unknown> | null;
}

export interface DbFlowOption {
  option_id: string;
  flow_id: string;
  from_node_id: string;
  label: string;
  to_node_id: string;
  sort_order: number;
}

export async function fetchInitialNode(
  flowId: string
): Promise<DbFlowNode | null> {
  const { data, error } = await supabase
    .from('chat_flow_nodes')
    .select('*')
    .eq('flow_id', flowId)
    .eq('is_initial', true)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('fetchInitialNode error', error);
    return null;
  }
  return data as unknown as DbFlowNode | null;
}

export async function fetchOptions(
  fromNodeId: string
): Promise<DbFlowOption[]> {
  const { data, error } = await supabase
    .from('chat_flow_options')
    .select('*')
    .eq('from_node_id', fromNodeId)
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('fetchOptions error', error);
    return [];
  }
  return (data || []) as unknown as DbFlowOption[];
}

export async function fetchNodeById(
  nodeId: string
): Promise<DbFlowNode | null> {
  const { data, error } = await supabase
    .from('chat_flow_nodes')
    .select('*')
    .eq('node_id', nodeId)
    .maybeSingle();
  if (error) {
    console.error('fetchNodeById error', error);
    return null;
  }
  return (data || null) as unknown as DbFlowNode | null;
}

export async function createSession(
  customerId: string
): Promise<string | null> {
  const sessionId = crypto.randomUUID();
  const { error } = await supabase.from('chat_sessions').insert({
    session_id: sessionId,
    customer_id: customerId,
    status: 'active',
  });
  if (error) {
    console.error('createSession error', error);
    return null;
  }
  return sessionId;
}

export async function attachSessionToFlow(params: {
  sessionId: string;
  flowId: string;
  nodeId: string;
}): Promise<boolean> {
  const { error } = await supabase.from('chat_session_flow').insert({
    session_id: params.sessionId,
    flow_id: params.flowId,
    current_node_id: params.nodeId,
  });
  if (error) {
    console.error('attachSessionToFlow error', error);
    return false;
  }
  return true;
}

export async function insertMessage(params: {
  sessionId: string;
  text: string;
  role: SenderRole;
  nodeId?: string | null;
}): Promise<{ messageId: string | null }> {
  const { data, error } = await supabase.rpc('api_insert_chat_message', {
    p_session_id: params.sessionId,
    p_text: params.text,
    p_role: params.role,
    p_node_id: params.nodeId || null,
  });
  if (error) {
    console.error('api_insert_chat_message error', error);
    return { messageId: null };
  }
  const messageId = ((data as any[])?.[0]?.message_id as string) || null;
  return { messageId };
}

export async function updateCurrentNode(
  sessionId: string,
  nodeId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('chat_session_flow')
    .update({ current_node_id: nodeId })
    .eq('session_id', sessionId);
  if (error) {
    console.error('updateCurrentNode error', error);
    return false;
  }
  return true;
}

export async function fetchSessionFlow(sessionId: string): Promise<{
  sessionId: string;
  flowId: string;
  currentNodeId: string;
  context: Record<string, unknown>;
} | null> {
  const { data, error } = await supabase
    .from('chat_session_flow')
    .select('session_id, flow_id, current_node_id, context')
    .eq('session_id', sessionId)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error('fetchSessionFlow error', error);
    return null;
  }
  return {
    sessionId: (data as any).session_id as string,
    flowId: (data as any).flow_id as string,
    currentNodeId: (data as any).current_node_id as string,
    context: ((data as any).context as Record<string, unknown>) || {},
  };
}

export async function setSessionContext(
  sessionId: string,
  context: Record<string, unknown>
): Promise<boolean> {
  const { error } = await supabase
    .from('chat_session_flow')
    .update({ context, updated_at: new Date().toISOString() })
    .eq('session_id', sessionId);
  if (error) {
    console.error('setSessionContext error', error);
    return false;
  }
  return true;
}

export async function fetchSessionCustomerId(
  sessionId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('customer_id')
    .eq('session_id', sessionId)
    .maybeSingle();
  if (error) {
    console.error('fetchSessionCustomerId error', error);
    return null;
  }
  return ((data as any)?.customer_id as string) || null;
}

export async function endSession(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ status: 'ended' })
    .eq('session_id', sessionId);
  if (error) {
    console.error('endSession error', error);
    return false;
  }
  const { error: flowErr } = await supabase
    .from('chat_session_flow')
    .update({ ended_at: new Date().toISOString() })
    .eq('session_id', sessionId);
  if (flowErr) console.error('endSession flow error', flowErr);
  return true;
}

export async function fetchEndNodeText(
  flowId: string
): Promise<{ nodeId: string; text: string } | null> {
  const { data, error } = await supabase
    .from('chat_flow_nodes')
    .select('node_id, text')
    .eq('flow_id', flowId)
    .eq('node_type', 'end')
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    nodeId: (data as any).node_id as string,
    text: (data as any).text as string,
  };
}

export interface DbSession {
  session_id: string;
  customer_id: string;
  status: string | null;
  created_at: string;
}

export interface DbSessionFlow {
  session_id: string;
  flow_id: string;
}

export interface DbFlow {
  flow_id: string;
  title: string;
}

export async function fetchUserSessions(): Promise<
  Array<{
    sessionId: string;
    flowId: string | null;
    status: string;
    createdAt: number;
    title: string;
  }>
> {
  const { data: sessions, error } = await supabase
    .from('chat_sessions')
    .select('session_id, customer_id, status, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('fetchUserSessions error', error);
    return [];
  }
  const list = (sessions || []) as DbSession[];
  if (list.length === 0) return [];
  const ids = list.map(s => s.session_id);
  const { data: flowsMap, error: flowErr } = await supabase
    .from('chat_session_flow')
    .select('session_id, flow_id')
    .in('session_id', ids);
  if (flowErr) console.error('fetchUserSessions session_flow error', flowErr);
  const sIdToFlow = new Map<string, string>();
  (flowsMap || []).forEach((r: any) =>
    sIdToFlow.set(r.session_id as string, r.flow_id as string)
  );

  const uniqueFlowIds = Array.from(new Set(Array.from(sIdToFlow.values())));
  let flowIdToTitle = new Map<string, string>();
  if (uniqueFlowIds.length > 0) {
    const { data: flows, error: fErr } = await supabase
      .from('chat_flows')
      .select('flow_id, title')
      .in('flow_id', uniqueFlowIds);
    if (fErr) console.error('fetchUserSessions chat_flows error', fErr);
    (flows || []).forEach((f: any) =>
      flowIdToTitle.set(f.flow_id as string, f.title as string)
    );
  }

  return list.map(s => {
    const flowId = sIdToFlow.get(s.session_id) || null;
    const title = (flowId && flowIdToTitle.get(flowId)) || 'Chat';
    return {
      sessionId: s.session_id,
      flowId,
      status: (s.status || 'active') as string,
      createdAt: new Date(s.created_at).getTime(),
      title,
    };
  });
}

export async function fetchSessionMessages(
  sessionId: string
): Promise<Array<{ id: string; role: SenderRole; text: string; ts: number }>> {
  const { data: msgs, error } = await supabase
    .from('chat_messages_secure')
    .select('message_id, message_text, sent_at')
    .eq('session_id', sessionId)
    .order('sent_at', { ascending: true });
  if (error) {
    console.error('fetchSessionMessages error', error);
    return [];
  }
  let messageList = (msgs || []) as Array<{
    message_id: string;
    message_text: string;
    sent_at: string;
  }>;
  if (messageList.length === 0) return [];
  const ids = messageList.map(m => m.message_id);
  const { data: metas, error: metaErr } = await supabase
    .from('chat_message_meta')
    .select('message_id, sender_role, node_id')
    .in('message_id', ids);
  if (metaErr) {
    console.error('fetchSessionMessages meta error', metaErr);
  }
  const idToRole = new Map<string, SenderRole>();
  const idToNodeId = new Map<string, string | null>();
  (metas || []).forEach((m: any) => {
    idToRole.set(m.message_id as string, m.sender_role as SenderRole);
    idToNodeId.set(m.message_id as string, (m.node_id as string) || null);
  });

  // Hydrate missing texts from node definitions (e.g., initial bot message)
  const missingWithNode = messageList
    .filter(m => !m.message_text)
    .map(m => idToNodeId.get(m.message_id))
    .filter((nid): nid is string => !!nid);
  if (missingWithNode.length > 0) {
    const uniqueNodeIds = Array.from(new Set(missingWithNode));
    const { data: nodes, error: nodeErr } = await supabase
      .from('chat_flow_nodes')
      .select('node_id, text')
      .in('node_id', uniqueNodeIds);
    if (!nodeErr && nodes) {
      const nodeIdToText = new Map<string, string>();
      (nodes as Array<{ node_id: string; text: string }>).forEach(n =>
        nodeIdToText.set(n.node_id, n.text)
      );
      messageList = messageList.map(m => {
        if (m.message_text) return m;
        const nodeId = idToNodeId.get(m.message_id) || null;
        const text =
          (nodeId && nodeIdToText.get(nodeId)) || m.message_text || '';
        return { ...m, message_text: text };
      });
    }
  }

  return messageList.map(m => ({
    id: m.message_id,
    role: idToRole.get(m.message_id) || 'printy',
    text: m.message_text,
    ts: new Date(m.sent_at).getTime(),
  }));
}

export async function fetchCurrentNode(
  sessionId: string
): Promise<DbFlowNode | null> {
  const { data, error } = await supabase
    .from('chat_session_flow')
    .select('current_node_id, flow_id')
    .eq('session_id', sessionId)
    .maybeSingle();
  if (error || !data) return null;
  const nodeId = (data as any).current_node_id as string;
  const { data: node, error: nodeErr } = await supabase
    .from('chat_flow_nodes')
    .select('*')
    .eq('node_id', nodeId)
    .maybeSingle();
  if (nodeErr) return null;
  return node as unknown as DbFlowNode | null;
}

// ===== Domain helpers for Issue Ticket actions =====

export async function fetchOrderSummaryForCustomer(
  orderId: string,
  customerId: string
): Promise<null | {
  order_id: string;
  order_status: string | null;
  order_datetime: string | null;
  page_size: string | null;
  quantity: number | null;
}> {
  const { data, error } = await supabase
    .from('orders')
    .select('order_id, order_status, order_datetime, page_size, quantity')
    .eq('order_id', orderId)
    .eq('customer_id', customerId)
    .maybeSingle();
  if (error) {
    console.error('fetchOrderSummaryForCustomer error', error);
    return null;
  }
  return (data as any) || null;
}

export async function listRecentOrdersForCustomer(
  customerId: string,
  limit: number
): Promise<Array<{ order_id: string; order_datetime: string }>> {
  const { data, error } = await supabase
    .from('orders')
    .select('order_id, order_datetime')
    .eq('customer_id', customerId)
    .order('order_datetime', { ascending: false })
    .limit(Math.max(1, Math.min(50, limit || 10)));
  if (error) {
    console.error('listRecentOrdersForCustomer error', error);
    return [];
  }
  return ((data as any[]) || []).map(r => ({
    order_id: r.order_id as string,
    order_datetime: r.order_datetime as string,
  }));
}

export async function fetchInquiryById(inquiryId: string): Promise<null | {
  inquiry_id: string;
  inquiry_message: string | null;
  inquiry_type: string | null;
  inquiry_status: string;
  resolution_comments: string | null;
  received_at: string;
}> {
  const { data, error } = await supabase.rpc('api_inquiry_by_id', {
    p_inquiry_id: inquiryId,
  });
  if (error) {
    console.error('api_inquiry_by_id error', error);
    return null;
  }
  const row = ((data as any[]) || [])[0];
  return (row as any) || null;
}

// For creating inquiries, reuse existing Edge Function with Turnstile
export async function createInquiryWithTurnstile(params: {
  message: string;
  inquiry_type: string;
}): Promise<{ ok: boolean; inquiry_id?: string }> {
  try {
    const { data, error } = await supabase.rpc('api_create_inquiry', {
      p_message: params.message,
      p_inquiry_type: params.inquiry_type,
    });
    if (error) {
      console.error('api_create_inquiry error', error);
      return { ok: false };
    }
    const inquiry_id = ((data as any[]) || [])[0]?.inquiry_id as
      | string
      | undefined;
    return inquiry_id ? { ok: true, inquiry_id } : { ok: false };
  } catch (e) {
    console.error('api_create_inquiry exception', e);
    return { ok: false };
  }
}

// ===== Quote Conversation Helpers =====

/**
 * Gets the quote_conversation_id from chat session metadata
 */
export async function getQuoteConversationIdFromSession(
  sessionId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('metadata')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) {
    console.error('getQuoteConversationIdFromSession error', error);
    return null;
  }

  return ((data as any)?.metadata?.quote_conversation_id as string) || null;
}

/**
 * DEPRECATED: Dual-write to quote_messages table
 * This function is no longer used as all messages now go to chat_messages_v2 only
 */
// Commented out - no longer needed with chat_messages_v2 migration
// export async function insertQuoteMessage(params: {
//   conversationId: string;
//   senderId: string;
//   senderRole: 'customer' | 'admin' | 'printy' | 'ai';
//   messageText: string;
//   messageType?: 'chat' | 'spec_summary' | 'spec_proposal' | 'system';
//   metadata?: Record<string, unknown>;
// }): Promise<{ messageId: string | null }> {
//   const { data, error } = await supabase.rpc('add_quote_message', {
//     p_conversation_id: params.conversationId,
//     p_sender_id: params.senderId,
//     p_sender_role: params.senderRole,
//     p_message_text: params.messageText,
//     p_message_type: params.messageType || 'chat',
//     p_metadata: params.metadata || {},
//   });
//
//   if (error) {
//     console.error('insertQuoteMessage error', error);
//     return { messageId: null };
//   }
//
//   return { messageId: (data as string) || null };
// }

/**
 * Creates a quote conversation and returns conversation_id and display_id
 */
export async function createQuoteConversation(params: {
  customerId: string;
}): Promise<{
  conversationId: string | null;
  displayId: string | null;
}> {
  const { data: conversationId, error: convError } = await supabase.rpc(
    'create_quote_conversation',
    { p_customer_id: params.customerId }
  );

  if (convError || !conversationId) {
    console.error('createQuoteConversation error', convError);
    return { conversationId: null, displayId: null };
  }

  // Fetch the auto-generated display_id
  const { data: quoteData, error: quoteError } = await supabase
    .from('quote_conversations')
    .select('display_id')
    .eq('conversation_id', conversationId)
    .single();

  if (quoteError || !quoteData?.display_id) {
    console.error('Failed to fetch quote display_id:', quoteError);
    return { conversationId: conversationId as string, displayId: null };
  }

  return {
    conversationId: conversationId as string,
    displayId: quoteData.display_id as string,
  };
}

/**
 * Links a chat session to a quote conversation via metadata
 */
export async function linkSessionToQuoteConversation(params: {
  sessionId: string;
  conversationId: string;
}): Promise<boolean> {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ metadata: { quote_conversation_id: params.conversationId } })
    .eq('session_id', params.sessionId);

  if (error) {
    console.error('linkSessionToQuoteConversation error', error);
    return false;
  }

  return true;
}
