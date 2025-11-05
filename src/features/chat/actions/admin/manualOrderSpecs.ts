/**
 * Action handler: manual_order_specs
 *
 * Opens the Spec Editor modal with an empty specification template for manual entry.
 * This allows admins to create quote specifications from scratch without AI assistance.
 *
 * @description
 * - Opens Spec Editor modal with blank/default specification structure
 * - Admin can manually fill in all specification fields
 * - Used when AI summarization is not needed or preferred
 * - Alternative to ai_summarize_specs for manual spec creation
 *
 * Fields available for manual entry:
 * - Product name
 * - Service code
 * - Category
 * - Description
 * - Size/dimensions
 * - Materials (multi-select)
 * - Color
 * - Finishing options (multi-select)
 * - Other specifications (multi-select)
 * - Quantity
 * - Quoted price
 * - Artwork requirements
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
 *   "id": "manual_spec",
 *   "type": "action",
 *   "action": "manual_order_specs",
 *   "action_config": {
 *     "conversation_id_key": "session_id"
 *   },
 *   "next": "await_editor_close"
 * }
 * ```
 *
 * @remarks
 * - Opens modal via specEditorEvents system
 * - No messages returned to avoid duplication (action node message already displayed)
 * - Spec is saved when admin submits the editor form
 * - Used in conjunction with send_quote_proposal to send completed specs
 */

import { openSpecEditor } from '@/features/chat/helpers/specEditorEvents';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function manualOrderSpecs(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { actionNode, context, sessionId } = params;

  const config = (actionNode.action_config as any) || {};
  const conversationIdKey = config.conversation_id_key || 'session_id';
  const conversationId = String(context[conversationIdKey] || '').trim();

  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  if (!conversationId) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Missing conversation ID for spec editor.',
      ts: Date.now(),
    });
    return { messages };
  }

  // Open Spec Editor with minimal default structure

  openSpecEditor({
    conversationId,
    specData: {
      product_name: '',
      service_id: '',
      category: '',
      description: '',
      size: '',
      materials: [],
      color: '',
      finishing: [],
      quantity: undefined,
      quoted_price: undefined,
      deadline: '',
      notes: '',
    },
    language: 'en',
    sessionId,
  });


  // Avoid duplicating the node's own message; no extra messages returned.
  return { messages };
}
