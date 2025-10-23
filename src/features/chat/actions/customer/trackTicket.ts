/**
 * Track Ticket Actions
 *
 * Handlers for customer ticket tracking flow:
 * - fetch_ticket_details: Load ticket and conversation history
 * - send_customer_reply: Customer responds to admin
 * - resolve_ticket: Customer marks ticket as resolved
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';
import { formatShortDate } from '@shared/utils/dateFormatter';
import { insertMessageV2 } from '@features/chat/api/jsonbChatFlowApi';

/**
 * Fetch ticket details and conversation history
 */
export async function fetchTicketDetails(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { context } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  try {
    // Get inquiry_id from context (passed from dashboard)
    const inquiryId = context?.inquiryId;

    if (!inquiryId) {
      console.error(
        '[fetchTicketDetails] No inquiryId found in context:',
        context
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Could not find your ticket. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    console.log('[fetchTicketDetails] Looking for inquiry with ID:', inquiryId);

    // Fetch inquiry details using inquiry_id from context
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries_v2')
      .select(
        'inquiry_id, display_id, inquiry_type, inquiry_status, order_id, received_at, session_id'
      )
      .eq('inquiry_id', inquiryId)
      .single();

    if (inquiryError) {
      console.error(
        '[fetchTicketDetails] Error fetching inquiry:',
        inquiryError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Could not find your ticket. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    if (!inquiry) {
      console.error('[fetchTicketDetails] No inquiry found for ID:', inquiryId);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Could not find your ticket. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    console.log('[fetchTicketDetails] Found inquiry:', inquiry);

    // Fetch all messages for the original session (where the inquiry was created) using RPC for proper decryption
    const originalSessionId = inquiry.session_id;
    console.log(
      '[fetchTicketDetails] Fetching messages for original session:',
      originalSessionId
    );

    const { data: chatMessages, error: messagesError } = await supabase.rpc(
      'api_fetch_chat_messages_v2',
      { p_session_id: originalSessionId }
    );

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    // Fetch order display_id if order_id is present
    let orderDisplayId = inquiry.order_id;
    if (inquiry.order_id) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('display_id')
        .eq('order_id', inquiry.order_id)
        .single();

      if (orderData?.display_id) {
        orderDisplayId = orderData.display_id;
      }
    }

    // Build conversation summary
    let conversationText = `Ticket ID: ${inquiry.display_id}\n`;
    conversationText += `Type: ${inquiry.inquiry_type}\n`;
    conversationText += `Status: ${formatStatus(inquiry.inquiry_status)}\n`;
    if (inquiry.order_id) {
      conversationText += `Related Order: ${orderDisplayId}\n`;
    }
    conversationText += `Created: ${formatShortDate(inquiry.received_at)}\n\n`;
    conversationText += `Conversation History:\n`;
    conversationText += `${'='.repeat(40)}\n\n`;

    // Display conversation messages
    if (chatMessages && chatMessages.length > 0) {
      // Filter to only show customer input messages and admin replies (skip system messages)
      const relevantMessages = chatMessages.filter(
        (msg: any) =>
          msg.sender_role === 'customer' || // All customer messages (including replies)
          msg.sender_role === 'admin' // Admin replies
      );

      console.log(
        '[fetchTicketDetails] Filtered messages:',
        relevantMessages.length,
        'out of',
        chatMessages.length
      );

      if (relevantMessages.length > 0) {
        // Deduplicate messages by content and sender to avoid showing repeated messages
        const seenMessages = new Set<string>();
        const uniqueMessages: any[] = [];

        for (const msg of relevantMessages) {
          console.log('[fetchTicketDetails] Processing message:', {
            message_id: msg.message_id,
            sender_role: msg.sender_role,
            message_text: msg.message_text,
            node_id: msg.node_id,
          });

          // Use the decrypted message_text from RPC function
          let decryptedText = msg.message_text || '[No message content]';

          // Handle messages that are still encrypted (show as JSON arrays)
          if (
            typeof decryptedText === 'string' &&
            decryptedText.startsWith('{"0":')
          ) {
            try {
              // Try to manually decrypt the JSON array format
              const jsonData = JSON.parse(decryptedText);
              const charCodes = Object.values(jsonData) as number[];
              decryptedText = String.fromCharCode(...charCodes);
            } catch (error) {
              // If parsing fails, skip this message
              continue;
            }
          }

          console.log(
            '[fetchTicketDetails] Using decrypted message:',
            decryptedText
          );

          // Create a unique key for deduplication (sender + content)
          const messageKey = `${msg.sender_role}:${decryptedText}`;

          // Only add if we haven't seen this exact message before
          if (!seenMessages.has(messageKey)) {
            seenMessages.add(messageKey);
            uniqueMessages.push({ ...msg, decryptedText });
          }
        }

        // Display unique messages
        for (const msg of uniqueMessages) {
          const timeAgo = formatShortDate(msg.sent_at);
          const sender = msg.sender_role === 'customer' ? 'You' : 'Admin';

          conversationText += `${sender} (${timeAgo}):\n${msg.decryptedText}\n\n`;
        }
      } else {
        conversationText += 'No conversation messages yet.\n\n';
      }
    } else {
      conversationText += 'No messages yet.\n\n';
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: conversationText,
      ts: Date.now(),
    });

    return { messages };
  } catch (error) {
    console.error('Error in fetchTicketDetails:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'An error occurred while fetching ticket details.',
      ts: Date.now(),
    });
    return { messages };
  }
}

/**
 * Send customer reply to admin
 */
export async function sendCustomerReply(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { context } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  const customerReply = String(context['customer_reply'] || '');

  if (!customerReply.trim()) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Please provide a reply message.',
      ts: Date.now(),
    });
    return { messages };
  }

  try {
    // Get inquiry_id from context to find the original session
    const inquiryId = context?.inquiryId;
    if (!inquiryId) {
      console.error('[sendCustomerReply] No inquiryId found in context');
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to send your reply. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Get the original session_id from the inquiry
    const { data: inquiry } = await supabase
      .from('inquiries_v2')
      .select('session_id')
      .eq('inquiry_id', inquiryId)
      .single();

    if (!inquiry?.session_id) {
      console.error(
        '[sendCustomerReply] No session_id found for inquiry:',
        inquiryId
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to send your reply. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    const originalSessionId = inquiry.session_id;

    // Store customer reply in chat_messages_v2 using the original session with proper encryption
    const result = await insertMessageV2({
      sessionId: originalSessionId,
      text: customerReply,
      role: 'customer',
      nodeId: 'customer_reply',
    });

    if (!result.messageId) {
      console.error('Error saving customer reply: No message ID returned');
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to send your reply. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Update inquiry status to pending_admin_reply using inquiry_id
    console.log(
      '[sendCustomerReply] Updating inquiry status to pending_admin_reply for inquiry_id:',
      inquiryId
    );
    const { data: updateData, error: statusError } = await supabase
      .from('inquiries_v2')
      .update({ inquiry_status: 'pending_admin_reply' })
      .eq('inquiry_id', inquiryId)
      .select('inquiry_id, inquiry_status');

    if (statusError) {
      console.error('[sendCustomerReply] Error updating status:', statusError);
    } else {
      console.log('[sendCustomerReply] Status update result:', updateData);
      if (updateData && updateData.length > 0) {
        console.log(
          '[sendCustomerReply] Status updated successfully to:',
          updateData[0].inquiry_status
        );
      } else {
        console.error(
          '[sendCustomerReply] No rows were updated - inquiry_id might not exist or no permission'
        );
      }
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Your reply has been sent to our support team. They will respond as soon as possible.',
      ts: Date.now(),
    });

    return { messages };
  } catch (error) {
    console.error('Error in sendCustomerReply:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'An error occurred while sending your reply.',
      ts: Date.now(),
    });
    return { messages };
  }
}

/**
 * Resolve ticket - customer marks as resolved
 */
export async function resolveTicket(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { context } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  try {
    // Get inquiry_id from context
    const inquiryId = context?.inquiryId;
    if (!inquiryId) {
      console.error('[resolveTicket] No inquiryId found in context');
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to mark ticket as resolved. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Get the original session_id from the inquiry
    const { data: inquiry } = await supabase
      .from('inquiries_v2')
      .select('session_id')
      .eq('inquiry_id', inquiryId)
      .single();

    if (!inquiry?.session_id) {
      console.error(
        '[resolveTicket] No session_id found for inquiry:',
        inquiryId
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to mark ticket as resolved. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    const originalSessionId = inquiry.session_id;

    // Update inquiry status to resolved using inquiry_id and set resolved_at timestamp
    const { error: statusError } = await supabase
      .from('inquiries_v2')
      .update({
        inquiry_status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('inquiry_id', inquiryId);

    if (statusError) {
      console.error('Error updating status:', statusError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to mark ticket as resolved. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Insert confirmation message into the original session
    const confirmMessage =
      'Ticket marked as resolved. Thank you for using our support!';
    const encryptedMessage = new TextEncoder().encode(confirmMessage);
    await supabase.from('chat_messages_v2').insert({
      session_id: originalSessionId,
      sender_role: 'printy',
      message_text_enc: encryptedMessage,
    });

    // End the original session
    await supabase
      .from('chat_sessions_v2')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('session_id', originalSessionId);

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: confirmMessage,
      ts: Date.now(),
    });

    return { messages };
  } catch (error) {
    console.error('Error in resolveTicket:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'An error occurred while resolving the ticket.',
      ts: Date.now(),
    });
    return { messages };
  }
}

/**
 * Helper function to format status for display
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    new: 'New',
    under_review: 'Under Review',
    pending_customer_reply: 'Pending Customer Reply',
    pending_admin_reply: 'Pending Admin Reply',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return statusMap[status] || status;
}
