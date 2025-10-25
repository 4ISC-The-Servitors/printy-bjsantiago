/**
 * Action handler: dynamic_choose_action
 *
 * Dynamically shows different options based on whether existing specifications exist.
 * If specs exist, shows "Edit Specs", "Send Specs", "Create New" options.
 * If no specs exist, shows "Summarize Order Specs", "Manual Order Specs" options.
 *
 * @description
 * - Checks for existing specifications in quote_specs table
 * - Shows context-appropriate options based on what's found
 * - Provides seamless flow experience for both new and existing specs
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing conversation_id/session_id
 * @param params.sessionId - Current admin chat session ID
 * @param params.customerId - Customer ID (not used in this action)
 *
 * @returns ActionExecutionResult with appropriate message
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "dynamic_choose",
 *   "type": "action",
 *   "action": "dynamic_choose_action",
 *   "action_config": {
 *     "conversation_id_key": "session_id"
 *   },
 *   "next": "conditional_options"
 * }
 * ```
 *
 * @remarks
 * - This action should be followed by conditional nodes based on context
 * - Stores has_existing_specs in context for flow navigation
 * - Provides user-friendly messages based on spec existence
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function dynamicChooseAction(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { actionNode, context } = params;

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
      text: 'Missing conversation ID. Cannot check existing specifications.',
      ts: Date.now(),
    });
    return { messages };
  }

  try {
    // Check for existing specs
    const { data: existingSpecs, error: specError } = await supabase
      .from('quote_specs')
      .select('spec_id, created_at, spec_data')
      .eq('session_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (specError) {
      console.error('[dynamicChooseAction] Error fetching specs:', specError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error checking existing specifications. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    const hasExistingSpecs = existingSpecs && existingSpecs.length > 0;

    // Store the result in context for the flow to use
    context.has_existing_specs = hasExistingSpecs;
    context.existing_spec_id = hasExistingSpecs
      ? existingSpecs[0].spec_id
      : null;

    // Don't add messages here - let the next node (conditional_options) handle the message display
    // The action only needs to set the context for the flow to use
  } catch (error: any) {
    console.error('[dynamicChooseAction] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: `Error checking specifications: ${error?.message || 'Unknown error'}`,
      ts: Date.now(),
    });
  }

  return { messages };
}
