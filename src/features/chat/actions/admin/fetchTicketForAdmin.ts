/**
 * Fetch Ticket for Admin Review
 *
 * Handler for admin reviewing customer support tickets
 * Displays ticket details including inquiry type, customer description, and order ID
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';
import { formatShortDate } from '@shared/utils/dateFormatter';

/**
 * Fetch ticket details for admin review
 */
export async function fetchTicketForAdmin(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { context } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  // Get inquiry_id from context (set by admin chat handler)
  const inquiryId = context.inquiry_id;

  if (!inquiryId) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'No ticket ID provided. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  try {
    // Fetch inquiry details by inquiry_id
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries_v2')
      .select(
        `
        inquiry_id,
        display_id,
        inquiry_type,
        inquiry_status,
        order_id,
        received_at,
        session_id,
        customer_id,
        customer:customer_id(first_name, last_name, customer_type)
      `
      )
      .eq('inquiry_id', inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      console.error('Error fetching inquiry:', inquiryError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Could not find ticket details. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Fetch all messages from chat_messages_v2 using RPC for proper decryption
    const { data: allMessages, error: messagesError } = await supabase.rpc(
      'api_fetch_chat_messages_v2',
      { p_session_id: inquiry.session_id }
    );

    if (messagesError) {
      console.error('Error fetching customer messages:', messagesError);
    }

    // Check if this is a pending_admin_reply or resolved status - if so, show full conversation history
    const shouldShowFullHistory =
      inquiry.inquiry_status === 'pending_admin_reply' ||
      inquiry.inquiry_status === 'resolved';

    let customerDescription = 'No description provided';
    let conversationHistory = '';

    if (allMessages && allMessages.length > 0) {
      if (shouldShowFullHistory) {
        // For pending_admin_reply or resolved, show full conversation history like trackTicket
        conversationHistory = `\n\nConversation History:\n${'='.repeat(40)}\n\n`;

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
            const sender =
              msg.sender_role === 'customer' ? 'Customer' : 'Admin';

            conversationHistory += `${sender} (${timeAgo}):\n${msg.decryptedText}\n\n`;
          }
        } else {
          conversationHistory += 'No conversation messages yet.\n\n';
        }
      } else {
        // For new tickets, show only the initial description
        // Look for message with node_id 'collect_details' or metadata containing inquiry_type
        const descriptionMessage = allMessages.find(
          (msg: any) =>
            msg.sender_role === 'customer' &&
            (msg.node_id === 'collect_details' || msg.metadata?.inquiry_type)
        );
        if (descriptionMessage) {
          customerDescription = descriptionMessage.message_text;
        }
      }
    }

    // Fetch order details if order_id is present
    let orderInfo = '';
    if (inquiry.order_id) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('display_id, status, total_amount')
        .eq('order_id', inquiry.order_id)
        .single();

      if (orderData) {
        orderInfo = `\n\nRelated Order: ${orderData.display_id}\nStatus: ${orderData.status}\nAmount: ₱${orderData.total_amount}`;
      }
    }

    // Build ticket info display
    const customerName = inquiry.customer
      ? `${(inquiry.customer as any).first_name} ${(inquiry.customer as any).last_name}`
      : 'Unknown';

    // Build ticket info display based on status
    let ticketInfo = '';

    if (shouldShowFullHistory) {
      // For pending admin reply or resolved, show ticket info with full conversation history
      ticketInfo = `TICKET UPDATE - ${formatStatus(inquiry.inquiry_status)}

Ticket ID: ${inquiry.display_id}
Customer: ${customerName}
Status: ${formatStatus(inquiry.inquiry_status)}
Received: ${formatShortDate(inquiry.received_at)}

Customer inquiry type: ${formatInquiryType(inquiry.inquiry_type)}${orderInfo}${conversationHistory}`;
    } else {
      // For new tickets, show the original format
      ticketInfo = `NEW TICKET REQUEST

Ticket ID: ${inquiry.display_id}
Customer: ${customerName}
Status: ${formatStatus(inquiry.inquiry_status)}
Received: ${formatShortDate(inquiry.received_at)}

Customer inquiry type: ${formatInquiryType(inquiry.inquiry_type)}

Customer description:
${customerDescription}${orderInfo}`;
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: ticketInfo,
      ts: Date.now(),
    });

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'What would you like to do?',
      ts: Date.now(),
    });

    // Store customer's session_id in context for other actions to use
    return {
      messages,
      context: {
        customer_session_id: inquiry.session_id,
        inquiry_id: inquiry.inquiry_id,
      },
    };
  } catch (error) {
    console.error('Error in fetchTicketForAdmin:', error);
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
 * Helper function to format inquiry type
 */
function formatInquiryType(type: string): string {
  const typeMap: Record<string, string> = {
    quality: 'Printing Quality Issue',
    delivery: 'Delivery Problem',
    billing: 'Billing Problem',
    other: 'Other Concern',
  };
  return typeMap[type] || type;
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
