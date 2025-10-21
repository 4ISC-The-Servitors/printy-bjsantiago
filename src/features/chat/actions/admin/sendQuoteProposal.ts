/**
 * Action handler: send_quote_proposal
 *
 * Sends the latest saved specification as a formal proposal to the customer.
 * Creates a proposal record and updates quote status to indicate proposal sent.
 *
 * @description
 * - Retrieves latest saved specification from quote_specs table
 * - Validates that quoted_price is present in the spec
 * - Creates a new proposal record in quote_proposals table
 * - Updates quote status to 'spec_proposed'
 * - Returns success message with proposal ID
 *
 * Process flow:
 * 1. Fetch latest spec by session_id (customer's quote session)
 * 2. Verify spec has quoted_price (required)
 * 3. Create quote_proposals record with:
 *    - session_id (customer's quote session)
 *    - spec_id (reference to saved spec)
 *    - spec_final (complete specification data)
 *    - quoted_price
 *    - status: 'sent'
 *    - sent_at timestamp
 * 4. Update quotes table status to 'spec_proposed'
 * 5. Notify admin of success
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing conversation_id/session_id
 * @param params.sessionId - Current admin chat session ID (not used for query)
 * @param params.customerId - Customer ID (not used in this action)
 *
 * @returns ActionExecutionResult with success message containing proposal ID
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "send_proposal",
 *   "type": "action",
 *   "action": "send_quote_proposal",
 *   "action_config": {
 *     "conversation_id_key": "session_id"
 *   },
 *   "next": "confirmation_message"
 * }
 * ```
 *
 * @remarks
 * - Requires admin to have saved specs via Spec Editor first
 * - conversation_id refers to CUSTOMER's quote session, not admin's chat session
 * - Quoted price validation prevents sending incomplete proposals
 * - Proposal ID is truncated in message for brevity (first 8 chars)
 * - Customer can view proposal in their quote details flow
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function sendQuoteProposal(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { actionNode, context } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  const config = actionNode.action_config as any;
  const conversationIdKey = config.conversation_id_key || 'session_id';
  // Note: conversationId here refers to the CUSTOMER's quote session (ask-quote flow),
  // NOT the admin's chat session (admin-quote-propose flow)
  const conversationId = String(context[conversationIdKey] || '').trim();

  if (!conversationId) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Missing conversation ID. Cannot send proposal.',
      ts: Date.now(),
    });
    return { messages };
  }

  // Load latest saved spec for this customer quote session
  console.log(
    '[sendQuoteProposal] Fetching specs for customer quote session_id:',
    conversationId
  );
  const { data: existingSpecs, error: specError } = await supabase
    .from('quote_specs')
    .select('*')
    .eq('session_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1);

  console.log('[sendQuoteProposal] Query result:', {
    found: existingSpecs?.length || 0,
    error: specError,
    sessionId: conversationId,
  });

  if (specError) {
    console.error('[sendQuoteProposal] Error fetching specs:', specError);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Error fetching saved specifications. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  if (!existingSpecs || existingSpecs.length === 0) {
    console.error(
      '[sendQuoteProposal] No saved specifications found for session:',
      conversationId
    );
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'No saved specifications found. Please prepare specs first.',
      ts: Date.now(),
    });
    return { messages };
  }

  const latestSpec = existingSpecs[0];
  const specData = latestSpec.spec_data;

  if (!specData?.quoted_price) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Quoted price is missing. Add a price in the spec form before sending.',
      ts: Date.now(),
    });
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
    console.error(
      '[sendQuoteProposal] Error creating proposal:',
      proposalError
    );
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Error creating proposal. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  // Update quote status in quotes table
  const { error: quoteUpdateError } = await supabase
    .from('quotes')
    .update({
      status: 'spec_proposed',
      updated_at: new Date().toISOString(),
    })
    .eq('session_id', conversationId);

  if (quoteUpdateError) {
    console.error(
      '[sendQuoteProposal] Error updating quote status:',
      quoteUpdateError
    );
  }

  messages.push({
    id: crypto.randomUUID(),
    role: 'printy',
    text: `Specifications sent to customer successfully.`,
    ts: Date.now(),
  });

  return { messages };
}
