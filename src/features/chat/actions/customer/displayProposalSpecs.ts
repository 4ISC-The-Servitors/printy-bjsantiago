/**
 * Action handler: display_proposal_specs
 *
 * Displays the admin's proposed specifications for the quote.
 * This shows the detailed specs that the admin created based on the customer's request.
 *
 * @description
 * - Fetches latest quote proposal with specifications
 * - Formats and displays the proposal specs in a structured message
 * - Persists the formatted message to chat history
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing conversation_id
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Customer viewing the quote details
 *
 * @returns ActionExecutionResult with formatted proposal specs message
 */
import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';
import { buildSpecHeaderLines } from '@features/chat/helpers/specDisplay';

export async function displayProposalSpecs(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { actionNode, context, sessionId: _sessionId } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  const config = actionNode.action_config as any;
  const conversationIdKey = config.conversation_id_key || 'conversation_id';
  let conversationId = String(context[conversationIdKey] || '').trim();

  // If conversationId is a quote_id, we need to find the actual session_id
  if (conversationId && conversationId.length > 30) {

    // Query quotes table to get the session_id for this quote
    const { data: quoteData } = await supabase
      .from('quotes')
      .select('session_id')
      .eq('quote_id', conversationId)
      .single();

    if (quoteData?.session_id) {
      conversationId = quoteData.session_id;
    }
  }

  if (!conversationId) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Quote conversation not found. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  try {
    // Check for proposals (using session_id)
    const { data: proposals } = await supabase
      .from('quote_proposals')
      .select(
        `
        proposal_id,
        spec_final,
        notes,
        created_at
      `
      )
      .eq('session_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (proposals && proposals.length > 0) {
      const proposal = proposals[0];
      const specData = proposal.spec_final;

      // Build proposal details
      const header = await buildSpecHeaderLines({
        service_id: (specData as any)?.service_id,
        category: (specData as any)?.category,
      });
      const proposalDetails = ['Admin Proposal:\n'];
      if (header.length > 0) {
        proposalDetails.push(header.join('\n'));
      }
      proposalDetails.push(
        `• Product: ${specData.product_name || 'Not specified'}`
      );

      // category now included in header if present
      if (specData.description)
        proposalDetails.push(`• Description: ${specData.description}`);
      if (specData.size) proposalDetails.push(`• Size: ${specData.size}`);
      if (specData.materials && specData.materials.length > 0) {
        proposalDetails.push(`• Materials: ${specData.materials.join(', ')}`);
      }
      if (specData.color) proposalDetails.push(`• Color: ${specData.color}`);
      if (specData.finishing && specData.finishing.length > 0) {
        proposalDetails.push(`• Finishing: ${specData.finishing.join(', ')}`);
      }
      if (specData.quantity)
        proposalDetails.push(`• Quantity: ${specData.quantity}`);
      if (specData.deadline)
        proposalDetails.push(`• Deadline: ${specData.deadline}`);
      if (specData.notes) proposalDetails.push(`• Notes: ${specData.notes}`);
      if (proposal.notes)
        proposalDetails.push(`• Admin Notes: ${proposal.notes}`);

      const proposalText = proposalDetails.join('\n');

      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: proposalText,
        ts: Date.now(),
      });

      // ✅ FIX: Don't insert message here - JsonbFlowProcessor caller will handle it
      // This prevents duplicate messages in the database
    } else {
      const noProposalText =
        'Your quote request is being reviewed by our admin team. We will send you a detailed proposal with pricing soon.';

      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: noProposalText,
        ts: Date.now(),
      });

      // ✅ FIX: Don't insert message here - JsonbFlowProcessor caller will handle it
      // This prevents duplicate messages in the database
    }
  } catch (error) {
    console.error('Error displaying proposal specs:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Error loading proposal specifications. Please try again.',
      ts: Date.now(),
    });
  }

  return { messages };
}
