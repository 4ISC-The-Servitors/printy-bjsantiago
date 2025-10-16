/**
 * Action handler: create_quote_conversation
 * Creates a new quote conversation and adds the initial message
 */

import { supabase } from '../../../../../lib/supabase';
import { insertMessage } from '../helpers/flowHelpers';
import type { ActionExecutionParams, ActionExecutionResult } from '../types';

export async function createQuoteConversation(params: ActionExecutionParams): Promise<ActionExecutionResult> {
  const { actionNode, context, customerId, sessionId } = params;
  const messages: Array<{ id: string; role: 'printy'; text: string; ts: number }> = [];

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
  const { data: displayIdData } = await supabase.rpc('get_next_sequence_value', { sequence_name: 'quote_display_seq' });
  const displayId = `QOT-${String(displayIdData || 1).padStart(6, '0')}`;
  const quoteId = crypto.randomUUID();

  // Add quote metadata to CURRENT session (don't create a new session)
  const { data: currentSession } = await supabase
    .from('chat_sessions_v2')
    .select('metadata')
    .eq('session_id', sessionId)
    .single();

  const updatedMetadata = {
    ...(currentSession?.metadata || {}),
    quote: {
      display_id: displayId,
      quote_id: quoteId,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  // Update current session with quote metadata
  const { error: updateError } = await supabase
    .from('chat_sessions_v2')
    .update({ metadata: updatedMetadata })
    .eq('session_id', sessionId);

  if (updateError) {
    console.error('Failed to update session with quote metadata:', updateError);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Sorry, there was an error creating your quote request. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  // NOTE: User's quote details message is already inserted by JsonbFlowProcessor.processInput()
  // before this action executes, so we don't need to insert it again here.
  // The message was inserted at line 180 of JsonbFlowProcessor before calling this action handler.

  // Create quote record in quotes table for admin tracking
  const { error: quoteInsertError } = await supabase
    .from('quotes')
    .insert({
      quote_id: quoteId,
      customer_id: customerId,
      session_id: sessionId,
      display_id: displayId,
      status: 'active',
    });

  if (quoteInsertError) {
    console.error('Failed to create quote record:', quoteInsertError);
    // Continue anyway - the quote metadata is already in the session
  }

  // Success message matching askQuoteFlow.ts
  const successText = `Your quote request has been submitted successfully! Here is your Quote ID: ${displayId}\n\nOur team will review your requirements and send you a detailed proposal with pricing soon. You can track your quote status in your dashboard.\n\nWe'll notify you as soon as we have an update!`;

  messages.push({
    id: crypto.randomUUID(),
    role: 'printy',
    text: successText,
    ts: Date.now(),
  });

  await insertMessage({
    sessionId,
    text: successText,
    role: 'printy',
    nodeId: actionNode.action,
  });

  return { messages };
}
