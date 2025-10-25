/**
 * Action handler: check_existing_specs
 *
 * Checks if there are already saved specifications for the current quote session
 * and shows appropriate options (edit existing vs create new) based on what's found.
 *
 * @description
 * - Fetches any existing specifications from quote_specs table
 * - If specs exist, shows "Edit Specs" and "Send Specs" options
 * - If no specs exist, shows "Summarize Order Specs" and "Manual Order Specs" options
 * - Provides context-aware flow navigation based on existing data
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing conversation_id/session_id
 * @param params.sessionId - Current admin chat session ID
 * @param params.customerId - Customer ID (not used in this action)
 *
 * @returns ActionExecutionResult with appropriate options based on existing specs
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "check_specs",
 *   "type": "action",
 *   "action": "check_existing_specs",
 *   "action_config": {
 *     "conversation_id_key": "session_id"
 *   },
 *   "next": "dynamic_options"
 * }
 * ```
 *
 * @remarks
 * - Uses session_id to look up existing specs
 * - Returns different quick replies based on spec existence
 * - Enables context-aware flow progression
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function checkExistingSpecs(
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
      console.error('[checkExistingSpecs] Error fetching specs:', specError);
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

    if (hasExistingSpecs) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'I found existing specifications for this quote. What would you like to do?',
        ts: Date.now(),
      });
    } else {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'No existing specifications found. Choose how to prepare the specifications.',
        ts: Date.now(),
      });
    }
  } catch (error: any) {
    console.error('[checkExistingSpecs] Unexpected error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: `Error checking specifications: ${error?.message || 'Unknown error'}`,
      ts: Date.now(),
    });
  }

  return { messages };
}
