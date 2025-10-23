/**
 * Change Ticket Status Action
 *
 * Handler for admin changing ticket status (Under Review, Resolved, Closed)
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

/**
 * Change ticket status
 */
export async function ticketChangeStatus(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { context } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  const newStatus = String(context['ticket_status'] || '');
  const customerSessionId = context['customer_session_id'];
  const inquiryId = context['inquiry_id'];

  // Validate status
  const validStatuses = ['under_review', 'resolved', 'closed'];
  if (!validStatuses.includes(newStatus)) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Invalid status selected. Please choose Under Review, Resolved, or Closed.',
      ts: Date.now(),
    });
    return { messages };
  }

  if (!inquiryId) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Ticket information not found. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  try {
    // Update inquiry status and set resolved_at if changing to resolved
    const updateData: any = { inquiry_status: newStatus };
    if (newStatus === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error: statusError } = await supabase
      .from('inquiries_v2')
      .update(updateData)
      .eq('inquiry_id', inquiryId);

    if (statusError) {
      console.error('Error updating ticket status:', statusError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to update ticket status. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Insert status change notification in customer's session (if available)
    const statusLabel = formatStatusLabel(newStatus);

    if (customerSessionId) {
      const notificationText = `Ticket status changed to: ${statusLabel}`;
      const encryptedMessage = new TextEncoder().encode(notificationText);

      await supabase.from('chat_messages_v2').insert({
        session_id: customerSessionId,
        sender_role: 'printy',
        message_text_enc: encryptedMessage,
        metadata: {
          action: 'status_change',
          old_status: context['previous_status'],
          new_status: newStatus,
        },
      });
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: `Ticket status updated to: ${statusLabel}`,
      ts: Date.now(),
    });

    return { messages };
  } catch (error) {
    console.error('Error in ticketChangeStatus:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'An error occurred while updating the ticket status.',
      ts: Date.now(),
    });
    return { messages };
  }
}

/**
 * Helper function to format status labels
 */
function formatStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    under_review: 'Under Review',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return labelMap[status] || status;
}
