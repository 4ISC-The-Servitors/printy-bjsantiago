/**
 * Action handler: create_inquiry
 * Creates a support inquiry/ticket
 */

import { supabase } from '../../../../../../lib/supabase';
import { insertMessage } from '../../helpers/flowHelpers';
import type { ActionExecutionParams, ActionExecutionResult } from '../../types';

export async function createInquiry(params: ActionExecutionParams): Promise<ActionExecutionResult> {
  const { actionNode, context, customerId, sessionId } = params;
  const messages: Array<{ id: string; role: 'printy'; text: string; ts: number }> = [];

  const config = actionNode.action_config as any;
  const typeKey = config.type_key || 'inquiry_type';
  const detailsKey = config.details_key || 'issue_details';

  const inquiryType = String(context[typeKey] || 'other');
  const issueDetails = String(context[detailsKey] || '');

  if (!issueDetails) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Please provide issue details.',
      ts: Date.now(),
    });
    return { messages };
  }

  // Create inquiry directly - let database auto-generate display_id
  const { data: inquiryData, error } = await supabase
    .from('inquiries')
    .insert({
      customer_id: customerId,
      inquiry_type: inquiryType,
      inquiry_message_enc: issueDetails, // Store as plain text for now
      inquiry_status: 'new',
    })
    .select('inquiry_id, display_id')
    .single();

  if (error) {
    console.error('Failed to create inquiry:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: "Couldn't create the ticket. Try again later.",
      ts: Date.now(),
    });
    return { messages };
  }

  const inquiryId = inquiryData?.inquiry_id;
  let displayId = inquiryData?.display_id;

  if (!inquiryId) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: "Couldn't create the ticket. Try again later.",
      ts: Date.now(),
    });
    return { messages };
  }

  // Fallback: use inquiry_id if display_id is not available
  if (!displayId) {
    displayId = inquiryId;
  }

  // Update session metadata to store inquiry_id
  await supabase
    .from('chat_sessions_v2')
    .update({
      metadata: {
        ...context,
        inquiry_id: inquiryId,
      } as any,
    })
    .eq('session_id', sessionId);

  // Success message matching issueTicketFlow.ts
  let successText = `Your support ticket has been created! Here is your Ticket ID: ${displayId}\n\nOur team will review your issue and get back to you as soon as possible. You can track the status of your ticket in your dashboard.\n\nWe appreciate your patience!`;

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
