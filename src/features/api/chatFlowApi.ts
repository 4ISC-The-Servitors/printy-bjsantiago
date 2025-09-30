import { supabase } from '../../lib/supabase';

export type SenderRole = 'user' | 'printy';

export interface DbFlowNode {
  node_id: string;
  flow_id: string;
  node_type: 'start' | 'message' | 'end';
  text: string;
  is_initial: boolean;
}

export interface DbFlowOption {
  option_id: string;
  flow_id: string;
  from_node_id: string;
  label: string;
  to_node_id: string;
  sort_order: number;
}

export async function fetchInitialNode(flowId: string): Promise<DbFlowNode | null> {
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

export async function fetchOptions(fromNodeId: string): Promise<DbFlowOption[]> {
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

export async function createSession(customerId: string): Promise<string | null> {
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
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ session_id: params.sessionId, message_text: params.text })
    .select('message_id')
    .single();
  if (error) {
    console.error('insertMessage error', error);
    return { messageId: null };
  }
  const messageId = (data as any)?.message_id as string;
  const { error: metaErr } = await supabase.from('chat_message_meta').insert({
    message_id: messageId,
    sender_role: params.role,
    node_id: params.nodeId || null,
  });
  if (metaErr) console.error('insertMessage meta error', metaErr);
  return { messageId };
}

export async function updateCurrentNode(sessionId: string, nodeId: string): Promise<boolean> {
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

export async function fetchEndNodeText(flowId: string): Promise<{ nodeId: string; text: string } | null> {
  const { data, error } = await supabase
    .from('chat_flow_nodes')
    .select('node_id, text')
    .eq('flow_id', flowId)
    .eq('node_type', 'end')
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return { nodeId: (data as any).node_id as string, text: (data as any).text as string };
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

export async function fetchUserSessions(): Promise<Array<{ sessionId: string; flowId: string | null; status: string; createdAt: number; title: string }>> {
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
  (flowsMap || []).forEach((r: any) => sIdToFlow.set(r.session_id as string, r.flow_id as string));

  const uniqueFlowIds = Array.from(new Set(Array.from(sIdToFlow.values())));
  let flowIdToTitle = new Map<string, string>();
  if (uniqueFlowIds.length > 0) {
    const { data: flows, error: fErr } = await supabase
      .from('chat_flows')
      .select('flow_id, title')
      .in('flow_id', uniqueFlowIds);
    if (fErr) console.error('fetchUserSessions chat_flows error', fErr);
    (flows || []).forEach((f: any) => flowIdToTitle.set(f.flow_id as string, f.title as string));
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

export async function fetchSessionMessages(sessionId: string): Promise<Array<{ id: string; role: SenderRole; text: string; ts: number }>> {
  const { data: msgs, error } = await supabase
    .from('chat_messages')
    .select('message_id, message_text, sent_at')
    .eq('session_id', sessionId)
    .order('sent_at', { ascending: true });
  if (error) {
    console.error('fetchSessionMessages error', error);
    return [];
  }
  const messageList = (msgs || []) as Array<{ message_id: string; message_text: string; sent_at: string }>;
  if (messageList.length === 0) return [];
  const ids = messageList.map(m => m.message_id);
  const { data: metas, error: metaErr } = await supabase
    .from('chat_message_meta')
    .select('message_id, sender_role')
    .in('message_id', ids);
  if (metaErr) {
    console.error('fetchSessionMessages meta error', metaErr);
  }
  const idToRole = new Map<string, SenderRole>();
  (metas || []).forEach((m: any) => idToRole.set(m.message_id as string, m.sender_role as SenderRole));
  return messageList.map(m => ({
    id: m.message_id,
    role: idToRole.get(m.message_id) || 'printy',
    text: m.message_text,
    ts: new Date(m.sent_at).getTime(),
  }));
}

export async function fetchCurrentNode(sessionId: string): Promise<DbFlowNode | null> {
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


