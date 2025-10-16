/**
 * Action handler: send_quote_proposal
 * Sends the latest saved spec as a proposal to the customer and updates status.
 */

import { supabase } from '../../../../../lib/supabase';
import type { ActionExecutionParams, ActionExecutionResult } from '../types';

export async function sendQuoteProposal(params: ActionExecutionParams): Promise<ActionExecutionResult> {
  const { actionNode, context } = params;
  const messages: Array<{ id: string; role: 'printy'; text: string; ts: number }> = [];

  const config = actionNode.action_config as any;
  const conversationIdKey = config.conversation_id_key || 'session_id';
  const conversationId = String(context[conversationIdKey] || '').trim();

  if (!conversationId) {
    messages.push({ id: crypto.randomUUID(), role: 'printy', text: 'Missing conversation ID. Cannot send proposal.', ts: Date.now() });
    return { messages };
  }

  // Load latest saved spec for this conversation
  const { data: existingSpecs, error: specError } = await supabase
    .from('quote_specs')
    .select('*')
    .or(`session_id.eq.${conversationId},conversation_id.eq.${conversationId}`)
    .order('created_at', { ascending: false })
    .limit(1);

  if (specError) {
    console.error('[sendQuoteProposal] Error fetching specs:', specError);
    messages.push({ id: crypto.randomUUID(), role: 'printy', text: 'Error fetching saved specifications. Please try again.', ts: Date.now() });
    return { messages };
  }

  if (!existingSpecs || existingSpecs.length === 0) {
    messages.push({ id: crypto.randomUUID(), role: 'printy', text: 'No saved specifications found. Please prepare specs first.', ts: Date.now() });
    return { messages };
  }

  const latestSpec = existingSpecs[0];
  const specData = latestSpec.spec_data;

  if (!specData?.quoted_price) {
    messages.push({ id: crypto.randomUUID(), role: 'printy', text: 'Quoted price is missing. Add a price in the spec form before sending.', ts: Date.now() });
    return { messages };
  }

  // Create proposal row
  const { data: proposalData, error: proposalError } = await supabase
    .from('quote_proposals')
    .insert({
      session_id: conversationId,
      spec_id: latestSpec.spec_id,
      spec_final: specData,
      quoted_price: specData.quoted_price,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .select('proposal_id')
    .single();

  if (proposalError) {
    console.error('[sendQuoteProposal] Error creating proposal:', proposalError);
    messages.push({ id: crypto.randomUUID(), role: 'printy', text: 'Error creating proposal. Please try again.', ts: Date.now() });
    return { messages };
  }

  // Update quote status in legacy conversation table for visibility
  await supabase
    .from('quote_conversations')
    .update({ status: 'spec_proposed' })
    .eq('conversation_id', conversationId);

  messages.push({
    id: crypto.randomUUID(),
    role: 'printy',
    text: `Specifications sent to customer successfully. Proposal ID: ${proposalData.proposal_id.slice(0, 8)}...`,
    ts: Date.now(),
  });

  return { messages };
}


