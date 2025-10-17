/**
 * Action handler: display_quote_details_admin
 *
 * Admin-facing version of quote details display. Shows customer's original request
 * and any existing proposals with specifications and pricing for admin review.
 *
 * @description
 * - Fetches original customer quote request messages from chat history
 * - Retrieves latest proposal (if any) from quote_proposals table
 * - Formats information for admin audience (technical, internal wording)
 * - Persists formatted details to admin's chat session
 * - Stores source_session_id in context for subsequent actions
 *
 * Information displayed:
 * - Original customer request (all customer messages)
 * - Latest proposal specifications (product, category, description, size, materials, color, finishing, quantity, deadline)
 * - Admin notes
 * - Quoted price
 * - Proposal status
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing session_id/conversation_id
 * @param params.sessionId - Current admin chat session ID
 * @param params.customerId - Customer ID (not used in this action)
 *
 * @returns ActionExecutionResult with formatted quote details for admin
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "show_admin_details",
 *   "type": "action",
 *   "action": "display_quote_details_admin",
 *   "action_config": {
 *     "conversation_id_key": "session_id"
 *   },
 *   "next": "ask_admin_action"
 * }
 * ```
 *
 * @remarks
 * - Uses RPC function api_fetch_chat_messages_v2 for secure encrypted message access
 * - Supports both session_id and legacy conversation_id in quote_proposals lookup
 * - Tailored for admin workflow (different wording than customer version)
 * - Stores source_session_id for tracking which quote is being worked on
 */

import { supabase } from '../../../../../../lib/supabase';
import { insertMessage, updateSessionMetadata } from '../../helpers/flowHelpers';
import type { ActionExecutionParams, ActionExecutionResult } from '../../types';
import type { SessionMetadata } from '../../../../../../chatFlows/types';

export async function displayQuoteDetailsAdmin(params: ActionExecutionParams): Promise<ActionExecutionResult> {
  const { actionNode, context, sessionId } = params;
  const messages: Array<{ id: string; role: 'printy'; text: string; ts: number }> = [];

  const config = actionNode.action_config as any;
  const sessionIdKey = config.conversation_id_key || 'session_id';
  const quoteSessionId = String(context[sessionIdKey] || '').trim();

  if (!quoteSessionId) {
    messages.push({ id: crypto.randomUUID(), role: 'printy', text: 'Session ID is missing for this quote.', ts: Date.now() });
    return { messages };
  }

  try {
    // Load messages via RPC (security definer)
    const { data: allMessages } = await supabase
      .rpc('api_fetch_chat_messages_v2', { p_session_id: quoteSessionId });

    let details = 'Original Customer Request:\n\n';
    if (Array.isArray(allMessages) && allMessages.length > 0) {
      const customerOnly = (allMessages as any[]).filter((m: any) => m.sender_role === 'customer');
      const original = customerOnly.map((m: any) => m.message_text).join('\n');
      details += (original || 'No customer text found.');
    } else {
      details += 'No customer text found.';
    }

    // Latest proposal (if any) – support session_id and legacy conversation_id
    const { data: proposals } = await supabase
      .from('quote_proposals')
      .select('proposal_id, spec_final, quoted_price, status, notes, created_at')
      .or(`session_id.eq.${quoteSessionId},conversation_id.eq.${quoteSessionId}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (Array.isArray(proposals) && proposals.length > 0) {
      const proposal = proposals[0];
      const spec = proposal.spec_final || {};
      const lines: string[] = [];
      lines.push('\n\nLatest Draft/Proposal:');
      if (spec.product_name) lines.push(`• Product: ${spec.product_name}`);
      if (spec.category) lines.push(`• Category: ${spec.category}`);
      if (spec.description) lines.push(`• Description: ${spec.description}`);
      if (spec.size) lines.push(`• Size: ${spec.size}`);
      if (Array.isArray(spec.materials) && spec.materials.length) lines.push(`• Materials: ${spec.materials.join(', ')}`);
      if (spec.color) lines.push(`• Color: ${spec.color}`);
      if (Array.isArray(spec.finishing) && spec.finishing.length) lines.push(`• Finishing: ${spec.finishing.join(', ')}`);
      if (spec.quantity) lines.push(`• Quantity: ${spec.quantity}`);
      if (spec.deadline) lines.push(`• Deadline: ${spec.deadline}`);
      if (spec.notes) lines.push(`• Notes: ${spec.notes}`);
      if (proposal.notes) lines.push(`• Admin Notes: ${proposal.notes}`);
      if (proposal.quoted_price != null) lines.push(`• Quoted Price: ₱${proposal.quoted_price}`);
      details += `\n${lines.join('\n')}`;
    }

    messages.push({ id: crypto.randomUUID(), role: 'printy', text: details, ts: Date.now() });

    await insertMessage({ sessionId, text: details, role: 'printy', nodeId: actionNode.action });

    // Store simple flags for downstream nodes
    const { data: currentSession } = await supabase
      .from('chat_sessions_v2')
      .select('metadata')
      .eq('session_id', sessionId)
      .single();

    if (currentSession) {
      const currentMetadata = currentSession.metadata as SessionMetadata;
      await updateSessionMetadata(sessionId, {
        ...currentMetadata,
        context: {
          ...context,
          source_session_id: quoteSessionId,
        } as any,
      });
    }
  } catch (e) {
    console.error('[displayQuoteDetailsAdmin] error:', e);
    messages.push({ id: crypto.randomUUID(), role: 'printy', text: 'Failed to load quote details.', ts: Date.now() });
  }

  return { messages };
}


