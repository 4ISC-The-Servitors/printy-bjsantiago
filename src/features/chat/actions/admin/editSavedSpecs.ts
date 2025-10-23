/**
 * Action handler: edit_saved_specs
 *
 * Loads the latest saved specification from the database and opens the Spec Editor
 * modal with the existing data for editing. This allows admins to modify previously
 * saved specifications instead of starting from scratch.
 *
 * @description
 * - Fetches the most recent saved specification from quote_specs table
 * - Opens Spec Editor modal with the loaded specification data
 * - Used when admin wants to edit existing specs rather than create new ones
 * - Alternative to open_spec_editor for editing existing data
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing conversation_id/session_id
 * @param params.sessionId - Current admin chat session ID
 * @param params.customerId - Customer ID (not used in this action)
 *
 * @returns ActionExecutionResult with success message or error
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "edit_saved_specs",
 *   "type": "action",
 *   "action": "edit_saved_specs",
 *   "action_config": {
 *     "conversation_id_key": "session_id"
 *   },
 *   "next": "wait_for_draft_save"
 * }
 * ```
 *
 * @remarks
 * - Loads latest spec by session_id (customer's quote session)
 * - Opens modal via specEditorEvents system with loaded data
 * - Falls back to empty spec if no saved data found
 * - Used in conjunction with send_quote_proposal to send updated specs
 */

import { supabase } from '@lib/supabase';
import { openSpecEditor } from '@features/quote/specEditorEvents';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function editSavedSpecs(
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

  try {
    // Load latest saved spec for this customer quote session
    console.log(
      '[editSavedSpecs] Fetching latest spec for customer quote session_id:',
      conversationId
    );
    const { data: existingSpecs, error: specError } = await supabase
      .from('quote_specs')
      .select('*')
      .eq('session_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    console.log('[editSavedSpecs] Query result:', {
      found: existingSpecs?.length || 0,
      error: specError,
      sessionId: conversationId,
    });

    if (specError) {
      console.error('[editSavedSpecs] Error fetching specs:', specError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error loading saved specifications. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    let specData: any;
    if (existingSpecs && existingSpecs.length > 0) {
      // Use the latest saved spec data
      specData = existingSpecs[0].spec_data;
      console.log('[editSavedSpecs] Loaded existing spec data:', specData);
    } else {
      // Fallback to empty spec if no saved data found
      console.log(
        '[editSavedSpecs] No saved specs found, using empty template'
      );
      specData = {
        product_name: '',
        service_code: '',
        category: '',
        description: '',
        size: '',
        materials: [],
        color: '',
        finishing: [],
        others: [],
        quantity: 1,
        quoted_price: 0,
        artwork: '',
        deadline: '',
        notes: '',
        admin_notes: '',
      };
    }

    // Open Spec Editor with loaded or default data
    openSpecEditor({
      conversationId,
      specData,
      language: 'en',
      sessionId,
    });

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Opening specification editor with saved data...',
      ts: Date.now(),
    });
  } catch (error: any) {
    console.error('[editSavedSpecs] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: `Error loading specifications: ${error?.message || 'Unknown error'}`,
      ts: Date.now(),
    });
  }

  return { messages };
}
