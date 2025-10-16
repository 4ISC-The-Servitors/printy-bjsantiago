/**
 * Action handler: display_quote_details
 * Displays details of a quote conversation including proposals
 */

import { supabase } from '../../../../../../lib/supabase';
import { insertMessage, updateSessionMetadata } from '../../helpers/flowHelpers';
import type { ActionExecutionParams, ActionExecutionResult } from '../../types';
import type { SessionMetadata } from '../../../../../../chatFlows/types';

export async function displayQuoteDetails(params: ActionExecutionParams): Promise<ActionExecutionResult> {
  const { actionNode, context, sessionId } = params;
  const messages: Array<{ id: string; role: 'printy'; text: string; ts: number }> = [];

  const config = actionNode.action_config as any;
  const conversationIdKey = config.conversation_id_key || 'session_id';
  const conversationId = String(context[conversationIdKey] || '').trim();

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
    // Load messages via RPC (security definer) to avoid RLS issues
    const { data: allMessages, error: msgError } = await supabase
      .rpc('api_fetch_chat_messages_v2', { p_session_id: conversationId });

    let quoteDetailsText = `Your Original Request:\n\n`;
    if (!msgError && allMessages && allMessages.length > 0) {
      const customerOnlyMessages = (allMessages as any[]).filter((m: any) => m.sender_role === 'customer');
      const originalRequestText = customerOnlyMessages.map((m: any) => m.message_text).join('\n');
      quoteDetailsText += (originalRequestText || 'No original request found.');
    } else {
      // As a best-effort fallback, try to read metadata if policies allow; do not fail if blocked
      try {
        const { data: session } = await supabase
          .from('chat_sessions_v2')
          .select('metadata')
          .eq('session_id', conversationId)
          .single();
        const contextQuoteDetails = session?.metadata?.context?.quote_details as string | undefined;
        quoteDetailsText += (contextQuoteDetails?.trim() || 'No original request found.');
      } catch {
        quoteDetailsText += 'No original request found.';
      }
    }

    // Check for proposals (using session_id)
    const { data: proposals } = await supabase
      .from('quote_proposals')
      .select(`
        proposal_id,
        spec_final,
        quoted_price,
        status,
        notes,
        created_at
      `)
      .eq('session_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (proposals && proposals.length > 0) {
      const proposal = proposals[0];
      const specData = proposal.spec_final;

      // Build proposal details
      const proposalDetails = ['Admin Proposal:\n'];
      proposalDetails.push(`• Product: ${specData.product_name || 'Not specified'}`);

      if (specData.category) proposalDetails.push(`• Category: ${specData.category}`);
      if (specData.description) proposalDetails.push(`• Description: ${specData.description}`);
      if (specData.size) proposalDetails.push(`• Size: ${specData.size}`);
      if (specData.materials && specData.materials.length > 0) {
        proposalDetails.push(`• Materials: ${specData.materials.join(', ')}`);
      }
      if (specData.color) proposalDetails.push(`• Color: ${specData.color}`);
      if (specData.finishing && specData.finishing.length > 0) {
        proposalDetails.push(`• Finishing: ${specData.finishing.join(', ')}`);
      }
      if (specData.quantity) proposalDetails.push(`• Quantity: ${specData.quantity}`);
      if (specData.deadline) proposalDetails.push(`• Deadline: ${specData.deadline}`);
      if (specData.notes) proposalDetails.push(`• Notes: ${specData.notes}`);
      if (proposal.notes) proposalDetails.push(`• Admin Notes: ${proposal.notes}`);

      quoteDetailsText += '\n\n' + proposalDetails.join('\n');
      quoteDetailsText += `\n\nQuoted Price: ₱${proposal.quoted_price}`;
    } else {
      quoteDetailsText += '\n\nYour quote request is being reviewed by our admin team. We will send you a detailed proposal with pricing soon.';
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: quoteDetailsText,
      ts: Date.now(),
    });

    // Save the quote details message to the database
    await insertMessage({
      sessionId,
      text: quoteDetailsText,
      role: 'printy',
      nodeId: actionNode.action,
    });

    // Store proposal status in context for dynamic options
    const hasProposal = proposals && proposals.length > 0;

    // Get current session metadata to update
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
          has_proposal: hasProposal,
          proposal_status: hasProposal ? proposals[0].status : null,
        } as any,
      });
    }

  } catch (error) {
    console.error('Error displaying quote details:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Error loading quote details. Please try again.',
      ts: Date.now(),
    });
  }

  return { messages };
}
