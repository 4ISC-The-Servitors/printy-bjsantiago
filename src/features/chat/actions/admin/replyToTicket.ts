/**
 * Admin Reply to Ticket Action
 *
 * Handler for admin responding to customer support tickets
 */

import { getAdminUserId } from '@features/chat/utils/admin/getAdminUserId';
import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';
import { insertMessageV2 } from '@features/chat/api/jsonbChatFlowApi';

/**
 * Send admin reply to customer ticket
 */
export async function sendAdminReply(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { context } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  const adminReply = String(context['admin_reply'] || '');
  const customerSessionId = context['customer_session_id'];
  const inquiryId = context['inquiry_id'];

  if (!adminReply.trim()) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Please provide a reply message.',
      ts: Date.now(),
    });
    return { messages };
  }

  if (!customerSessionId && !inquiryId) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Session information not found. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  try {
    // Store admin reply in chat_messages_v2 (in customer's original session) using proper encryption
    const result = await insertMessageV2({
      sessionId: customerSessionId,
      text: adminReply,
      role: 'admin',
      nodeId: 'admin_reply',
    });

    if (!result.messageId) {
      console.error('Error saving admin reply');
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to send reply. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Update inquiry status to pending_customer_reply
    console.log(
      '[sendAdminReply] Updating inquiry status to pending_customer_reply for inquiry_id:',
      inquiryId
    );
    const { data: updateData, error: statusError } = await supabase
      .from('inquiries_v2')
      .update({
        inquiry_status: 'pending_customer_reply',
        updated_by: await getAdminUserId(), // Track that admin replied to ticket
      })
      .eq('inquiry_id', inquiryId)
      .select('inquiry_id, inquiry_status');

    if (statusError) {
      console.error('[sendAdminReply] Error updating status:', statusError);
    } else {
      console.log('[sendAdminReply] Status update result:', updateData);
      if (updateData && updateData.length > 0) {
        console.log(
          '[sendAdminReply] Status updated successfully to:',
          updateData[0].inquiry_status
        );
      } else {
        console.error('[sendAdminReply] No rows were updated');
      }
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Reply sent to customer successfully.',
      ts: Date.now(),
    });

    return { messages };
  } catch (error) {
    console.error('Error in sendAdminReply:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'An error occurred while sending the reply.',
      ts: Date.now(),
    });
    return { messages };
  }
}
