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
import { getAllAdminIds } from '@features/chat/utils/admin/getAdminUserId';
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


    // Fetch all messages for the original session (where the inquiry was created) using RPC for proper decryption
    const originalSessionId = inquiry.session_id;

    const { data: chatMessages, error: messagesError } = await supabase.rpc(
      'api_fetch_chat_messages_v2',
      { p_session_id: originalSessionId }
    );

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    // Also fetch messages from ticket conversation sessions (admin/customer replies)
    const { data: ticketConversations, error: ticketError } = await supabase
      .from('chat_sessions_v2')
      .select('session_id')
      .eq('customer_id', params.customerId)
      .eq('metadata->>inquiry_id', inquiryId)
      .eq('metadata->>ticket_conversation', true);

    let ticketMessages: any[] = [];
    if (!ticketError && ticketConversations && ticketConversations.length > 0) {
      // Fetch messages from all ticket conversation sessions
      for (const ticketSession of ticketConversations) {
        const { data: ticketChatMessages } = await supabase.rpc(
          'api_fetch_chat_messages_v2',
          { p_session_id: ticketSession.session_id }
        );
        if (ticketChatMessages) {
          ticketMessages.push(...ticketChatMessages);
        }
      }
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

    // Combine original session messages and ticket conversation messages
    const allMessages = [
      ...(chatMessages || []),
      ...ticketMessages
    ].sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()); // Sort by sent_at

    // Display conversation messages
    if (allMessages && allMessages.length > 0) {
      // Filter to only show customer input messages and admin replies (skip system messages)
      const relevantMessages = allMessages.filter(
        (msg: any) =>
          msg.sender_role === 'customer' || // All customer messages (including replies)
          msg.sender_role === 'admin' // Admin replies
      );


      if (relevantMessages.length > 0) {
        // Deduplicate messages by content and sender to avoid showing repeated messages
        const seenMessages = new Set<string>();
        const uniqueMessages: any[] = [];

        for (const msg of relevantMessages) {

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

    // Get the original session_id and customer_id from the inquiry
    const { data: inquiry } = await supabase
      .from('inquiries_v2')
      .select('session_id, customer_id, display_id')
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
    const customerId = inquiry.customer_id;
    const ticketDisplayId = inquiry.display_id;

    if (!originalSessionId || !customerId) {
      console.error('[sendCustomerReply] Missing session_id or customer_id in inquiry');
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Session information not found. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Create a separate ticket conversation session (marked as ended so it doesn't appear in Recent Chats)
    const { data: ticketSession, error: sessionError } = await supabase
      .from('chat_sessions_v2')
      .insert({
        flow_id: 'track-ticket',
        customer_id: customerId,
        status: 'ended', // Mark as ended so it doesn't appear in Recent Chats
        metadata: {
          title: ticketDisplayId ? `Track Ticket: ${ticketDisplayId}` : 'Track Ticket',
          ticket_conversation: true,
          original_session_id: originalSessionId,
          inquiry_id: inquiryId,
          conversation_type: 'ticket_reply',
          customer_chat: true
        }
      })
      .select('session_id')
      .single();

    if (sessionError || !ticketSession?.session_id) {
      console.error('Error creating ticket conversation session for customer reply:', sessionError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to create conversation session. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Store customer reply in the ticket conversation session
    const result = await insertMessageV2({
      sessionId: ticketSession.session_id,
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
    const { error: statusError } = await supabase
      .from('inquiries_v2')
      .update({
        inquiry_status: 'pending_admin_reply',
        updated_by: params.customerId, // Track that customer replied to ticket
      })
      .eq('inquiry_id', inquiryId);

    if (statusError) {
      console.error('[sendCustomerReply] Error updating inquiry status:', statusError);
    }

    // Create notifications for admins about customer reply
    try {
      // Get customer name for the notification
      const { data: customerData } = await supabase
        .from('customer')
        .select('first_name, last_name')
        .eq('customer_id', params.customerId)
        .single();

      const customerName = customerData
        ? `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() ||
          'Customer'
        : 'Customer';


      // Get ticket display_id for notification
      const { data: ticketData } = await supabase
        .from('inquiries_v2')
        .select('display_id')
        .eq('inquiry_id', inquiryId)
        .single();

      const ticketDisplayId =
        ticketData?.display_id || inquiryId?.substring(0, 8);

      // Get all admin users
      const adminIds = await getAllAdminIds();

      if (adminIds.length > 0) {
        // Create notification for each admin
        const notifications = adminIds.map(adminId => ({
          customer_id: adminId,
          source_type: 'ticket',
          source_id: inquiryId,
          title: 'Customer Reply',
          message: `Customer ${customerName} replied to support ticket #${ticketDisplayId}.`,
          type: 'info',
          category: 'ticket',
        }));


        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error(
            '[sendCustomerReply] Error creating admin notifications:',
            notifError
          );
        } else {
        }
      }
    } catch (notifErr) {
      console.error(
        '[sendCustomerReply] Error in notification creation:',
        notifErr
      );
      // Don't fail the whole action if notifications fail
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

    // Get customer_id from inquiry
    const { data: inquiryFull } = await supabase
      .from('inquiries_v2')
      .select('customer_id')
      .eq('inquiry_id', inquiryId)
      .single();

    if (!inquiryFull?.customer_id) {
      console.error('[resolveTicket] No customer_id found for inquiry:', inquiryId);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to mark ticket as resolved. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Create a ticket conversation session for the resolution (same as replies)
    const { data: ticketSession, error: sessionError } = await supabase
      .from('chat_sessions_v2')
      .insert({
        flow_id: 'track-ticket', // Use existing track-ticket flow
        customer_id: inquiryFull.customer_id, // Required for RLS policy
        status: 'ended', // Mark as ended so it doesn't appear in Recent Chats
        metadata: {
          ticket_conversation: true,
          original_session_id: originalSessionId,
          inquiry_id: inquiryId,
          conversation_type: 'ticket_resolution',
          customer_chat: true
        }
      })
      .select('session_id')
      .single();

    if (sessionError || !ticketSession?.session_id) {
      console.error('Error creating ticket conversation session for resolution:', sessionError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to create conversation session. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Update inquiry status to resolved using inquiry_id and set resolved_at timestamp
    const { error: statusError } = await supabase
      .from('inquiries_v2')
      .update({
        inquiry_status: 'resolved',
        resolved_at: new Date().toISOString(),
        updated_by: params.customerId, // Track that customer resolved the ticket
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

    // Insert confirmation message into the ticket conversation session
    const confirmMessage =
      'Ticket marked as resolved. Thank you for using our support!';
    const result = await insertMessageV2({
      sessionId: ticketSession.session_id,
      text: confirmMessage,
      role: 'printy',
      nodeId: 'mark_resolved', // Use the existing mark_resolved node from track-ticket flow
    });

    if (!result.messageId) {
      console.error('Error saving resolution message');
    }

    // Create notifications for admins about ticket resolution
    try {
      // Get customer name for the notification
      const { data: customerData } = await supabase
        .from('customer')
        .select('first_name, last_name')
        .eq('customer_id', params.customerId)
        .single();

      const customerName = customerData
        ? `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() ||
          'Customer'
        : 'Customer';


      // Get ticket display_id for notification
      const { data: ticketData } = await supabase
        .from('inquiries_v2')
        .select('display_id')
        .eq('inquiry_id', inquiryId)
        .single();

      const ticketDisplayId =
        ticketData?.display_id || inquiryId?.substring(0, 8);

      // Get all admin users
      const adminIds = await getAllAdminIds();

      if (adminIds.length > 0) {
        // Create notification for each admin
        const notifications = adminIds.map(adminId => ({
          customer_id: adminId,
          source_type: 'ticket',
          source_id: inquiryId,
          title: 'Ticket Resolved',
          message: `Support ticket #${ticketDisplayId} was marked as resolved by ${customerName}.`,
          type: 'success',
          category: 'ticket',
        }));


        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error(
            '[resolveTicket] Error creating admin notifications:',
            notifError
          );
        } else {
        }
      }
    } catch (notifErr) {
      console.error(
        '[resolveTicket] Error in notification creation:',
        notifErr
      );
      // Don't fail the whole action if notifications fail
    }

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
