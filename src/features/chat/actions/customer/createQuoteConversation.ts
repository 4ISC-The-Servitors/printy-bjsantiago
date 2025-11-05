/**
 * Action handler: create_quote_conversation
 *
 * Creates a new quote request with a unique display ID and stores it in the database.
 * This action is typically called after collecting quote details from the customer.
 *
 * @description
 * - Generates a unique quote display ID (format: QOT-XXXXXX)
 * - Updates current session metadata with quote information
 * - Creates a quote record in the quotes table for admin tracking
 * - Returns a success message with the quote ID
 * - User's quote details are already inserted by JsonbFlowProcessor before this action
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing quote_details
 * @param params.customerId - Customer creating the quote
 * @param params.sessionId - Current chat session ID
 *
 * @returns ActionExecutionResult with success message containing quote display ID
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "create_quote",
 *   "type": "action",
 *   "action": "create_quote_conversation",
 *   "action_config": {
 *     "details_key": "quote_details"
 *   },
 *   "next": "success_message"
 * }
 * ```
 *
 * @remarks
 * The user's quote details message is already inserted by JsonbFlowProcessor.processInput()
 * before this action executes (at line 180 of JsonbFlowProcessor), so we don't duplicate
 * the message insertion here.
 */
import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function createQuoteConversation(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { actionNode, context, customerId, sessionId } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  const config = actionNode.action_config as any;
  const detailsKey = config.details_key || 'quote_details';
  const quoteDetails = String(context[detailsKey] || '');

  if (!quoteDetails) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: "No quote details found. Please describe what you'd like to print.",
      ts: Date.now(),
    });
    return { messages };
  }

  // Generate quote display_id using sequence
  const { data: displayIdData, error: sequenceError } = await supabase.rpc(
    'get_next_sequence_value',
    { sequence_name: 'quote_display_seq' }
  );

  if (sequenceError) {
    console.error('Failed to get next sequence value:', sequenceError);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Sorry, there was an error generating your quote ID. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  const displayId = `QOT-${String(displayIdData || 1).padStart(6, '0')}`;
  const quoteId = crypto.randomUUID();

  // FIRST: Create quote record in quotes table (required before setting FK)
  const { error: quoteInsertError } = await supabase.from('quotes').insert({
    quote_id: quoteId,
    customer_id: customerId,
    session_id: sessionId,
    display_id: displayId,
    status: 'active',
  });

  if (quoteInsertError) {
    console.error('Failed to create quote record:', quoteInsertError);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Sorry, there was an error creating your quote request. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  // SECOND: Get current session metadata
  const { data: currentSession } = await supabase
    .from('chat_sessions_v2')
    .select('metadata')
    .eq('session_id', sessionId)
    .single();

  const updatedMetadata = {
    ...(currentSession?.metadata || {}),
    context: {
      ...((currentSession?.metadata as any)?.context || {}),
      // Will be set below after fetching from customer table
    },
    quote: {
      display_id: displayId,
      quote_id: quoteId,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  // Fetch and store customer_type in session metadata.context for downstream actions
  try {
    const { data: customerRow } = await supabase
      .from('customer')
      .select('customer_type')
      .eq('customer_id', customerId)
      .maybeSingle();
    const customerType = (customerRow?.customer_type as string) || undefined;
    (updatedMetadata as any).context = {
      ...((updatedMetadata as any).context || {}),
      customer_type: customerType || 'regular',
    };
  } catch {
    (updatedMetadata as any).context = {
      ...((updatedMetadata as any).context || {}),
      customer_type: 'regular',
    };
  }

  // THIRD: Update current session with quote metadata and FK (now that quote exists)
  const { error: updateError } = await supabase
    .from('chat_sessions_v2')
    .update({
      quote_id: quoteId, // ✅ Set FK (quote now exists)
      metadata: updatedMetadata,
    })
    .eq('session_id', sessionId);

  if (updateError) {
    console.error('Failed to update session with quote metadata:', updateError);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Quote created but failed to link to session. Please contact support.',
      ts: Date.now(),
    });
    // Continue anyway - the quote was created successfully
  }

  // Success message matching askQuoteFlow.ts
  const successText = `Your quote request has been submitted successfully! Here is your Quote ID: ${displayId}\n\nOur team will review your requirements and send you a detailed proposal with pricing soon. You can track your quote status in your dashboard.\n\nWe'll notify you as soon as we have an update!`;

  messages.push({
    id: crypto.randomUUID(),
    role: 'printy',
    text: successText,
    ts: Date.now(),
  });

  // ✅ FIX: Don't insert message here - JsonbFlowProcessor caller will handle it
  // This prevents duplicate messages in the database

  return { messages };
}
