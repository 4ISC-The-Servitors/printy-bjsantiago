import { openSpecEditor } from '../../../../../quote/specEditorEvents';
import type { ActionExecutionParams, ActionExecutionResult } from '../../types';

/**
 * Action handler: open_spec_editor
 * Opens the Spec Editor with an empty spec for manual entry.
 */
export async function openSpecEditorManual(params: ActionExecutionParams): Promise<ActionExecutionResult> {
  const { actionNode, context, sessionId } = params;

  const config = (actionNode.action_config as any) || {};
  const conversationIdKey = config.conversation_id_key || 'session_id';
  const conversationId = String(context[conversationIdKey] || '').trim();

  const messages: Array<{ id: string; role: 'printy'; text: string; ts: number }> = [];

  if (!conversationId) {
    messages.push({ id: crypto.randomUUID(), role: 'printy', text: 'Missing conversation ID for spec editor.', ts: Date.now() });
    return { messages };
  }

  // Open Spec Editor with minimal default structure
  openSpecEditor({
    conversationId,
    specData: {
      product_name: '',
      service_code: '',
      category: '',
      description: '',
      size: '',
      materials: [],
      color: '',
      finishing: [],
      others: [],
      quantity: undefined,
      quoted_price: undefined,
      artwork: '',
      deadline: '',
      notes: '',
    },
    language: 'en',
    sessionId,
  });

  // Avoid duplicating the node's own message; no extra messages returned.
  return { messages };
}


