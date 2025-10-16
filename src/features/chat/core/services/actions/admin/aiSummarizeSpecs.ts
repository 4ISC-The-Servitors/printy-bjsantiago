/**
 * Action handler: ai_summarize_specs
 * Loads customer messages for the quote conversation, runs AI summarization,
 * and opens the Spec Editor modal prefilled with the AI-generated spec.
 */

import { supabase } from '../../../../../../lib/supabase';
import { openSpecEditor } from '../../../../../quote/specEditorEvents';
import { buildConversationPrompt } from '../../../../../quote/quoteAssistantPrompt';
import { generateWithCohere } from '../../../../../api/llmClient';
import type { ActionExecutionParams, ActionExecutionResult } from '../../types';

export async function aiSummarizeSpecs(params: ActionExecutionParams): Promise<ActionExecutionResult> {
  const { actionNode, context } = params;
  const messages: Array<{ id: string; role: 'printy'; text: string; ts: number }> = [];

  const config = actionNode.action_config as any;
  const conversationIdKey = config.conversation_id_key || 'session_id';
  const conversationId = String(context[conversationIdKey] || '').trim();

  if (!conversationId) {
    messages.push({ id: crypto.randomUUID(), role: 'printy', text: 'Missing conversation ID for summarization.', ts: Date.now() });
    return { messages };
  }

  // Load conversation messages via RPC from chat_messages_v2
  const { data, error } = await supabase.rpc('api_fetch_chat_messages_v2', {
    p_session_id: conversationId,
  });

  if (error) {
    console.error('[aiSummarizeSpecs] Failed to load messages:', error);
    messages.push({ id: crypto.randomUUID(), role: 'printy', text: 'Error reading conversation messages.', ts: Date.now() });
    return { messages };
  }

  const history = (data as any[] || []).map((m: any) => ({ role: m.sender_role, text: m.message_text }));
  const prompt = buildConversationPrompt(history);

  const analysis = await generateWithCohere([{ role: 'user', content: prompt }], true, 'command-nightly');

  // Open Spec Editor with AI spec
  openSpecEditor({
    conversationId,
    specData: { ...analysis.spec, quoted_price: undefined },
    language: 'en',
    sessionId: params.sessionId,
  });

  // Do not emit a message here; the action node's message is already displayed
  // and persisted by the flow processor. Returning no messages avoids duplicates.
  return { messages };
}


