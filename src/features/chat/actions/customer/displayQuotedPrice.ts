/**
 * Action handler: display_quoted_price
 *
 * Displays the quoted price for the proposal in a separate message bubble.
 * This shows the pricing information that the admin provided.
 *
 * @description
 * - Fetches latest quote proposal with pricing
 * - Displays the quoted price in a clean, prominent message
 * - Persists the formatted message to chat history
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing conversation_id
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Customer viewing the quote details
 *
 * @returns ActionExecutionResult with quoted price message
 */
import { supabase } from '@lib/supabase';
import { insertMessage } from '@features/chat/helpers/flowHelpers';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function displayQuotedPrice(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { actionNode, context, sessionId } = params;
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
    console.log(
      '[displayQuotedPrice] conversationId looks like quote_id, finding session_id...'
    );

    // Query quotes table to get the session_id for this quote
    const { data: quoteData } = await supabase
      .from('quotes')
      .select('session_id')
      .eq('quote_id', conversationId)
      .single();

    if (quoteData?.session_id) {
      conversationId = quoteData.session_id;
      console.log('[displayQuotedPrice] Found session_id:', conversationId);
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
      .select('quoted_price, status')
      .eq('session_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (proposals && proposals.length > 0) {
      const proposal = proposals[0];
      const priceText = `Quoted Price: ₱${proposal.quoted_price}`;

      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: priceText,
        ts: Date.now(),
      });

      // Save the quoted price message to the database
      await insertMessage({
        sessionId,
        text: priceText,
        role: 'printy',
        nodeId: actionNode.action,
      });
    } else {
      const noPriceText =
        'Pricing will be provided once your quote is reviewed.';

      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: noPriceText,
        ts: Date.now(),
      });

      await insertMessage({
        sessionId,
        text: noPriceText,
        role: 'printy',
        nodeId: actionNode.action,
      });
    }
  } catch (error) {
    console.error('Error displaying quoted price:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Error loading quoted price. Please try again.',
      ts: Date.now(),
    });
  }

  return { messages };
}
