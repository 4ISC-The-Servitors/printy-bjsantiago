/**
 * Action handler: ai_summarize_specs
 *
 * Uses AI to analyze customer quote request messages and generate structured
 * specifications, then opens the Spec Editor modal pre-filled with the AI-generated data.
 *
 * @description
 * - Fetches all messages from the customer's quote session (chat_messages_v2)
 * - Constructs a prompt with conversation history
 * - Calls Cohere AI API to generate structured specifications
 * - Opens Spec Editor modal with AI-generated spec (excluding price)
 * - Admin can review, edit, and add pricing before sending proposal
 *
 * AI analyzes and extracts:
 * - Product name and category
 * - Description and requirements
 * - Size/dimensions
 * - Materials needed
 * - Color preferences
 * - Finishing options
 * - Quantity
 * - Deadline
 * - Additional notes
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing conversation_id/session_id
 * @param params.sessionId - Current admin chat session ID
 * @param params.customerId - Customer ID (not used in this action)
 *
 * @returns ActionExecutionResult with empty messages (UI interaction only)
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "ai_summarize",
 *   "type": "action",
 *   "action": "ai_summarize_specs",
 *   "action_config": {
 *     "conversation_id_key": "session_id"
 *   },
 *   "next": "await_editor_close"
 * }
 * ```
 *
 * @remarks
 * - Uses Cohere's command-nightly model for AI generation
 * - Quoted price is intentionally left undefined for admin to fill
 * - Opens modal via specEditorEvents system
 * - No messages returned to avoid duplication (action node message already displayed)
 * - Requires api_fetch_chat_messages_v2 RPC function for encrypted message access
 */

import { supabase } from '@lib/supabase';
import { openSpecEditor } from '@features/quote/specEditorEvents';
import { buildConversationPrompt } from '@features/quote/quoteAssistantPrompt';
import { generateWithCohere } from '@features/api/shared/llmClient';
import type { ActionExecutionParams, ActionExecutionResult } from '@features/chat/types';

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


