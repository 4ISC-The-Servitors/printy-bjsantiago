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
import { formatShortTime } from '@shared/utils/timeFormatter';
import {
  formatInquiryType,
  formatOrderStatus,
} from '@shared/utils/statusFormatter';
import { getAdminUserInfoBatch } from '@features/chat/utils/admin/getAdminUserId';

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
    isHistorical?: boolean;
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

    // Only show initial issue details + initial uploaded images from the original session
    let customerDescription = 'No description provided';

    // Read issue_details from original session metadata
    if (inquiry.session_id) {
      const { data: originalSession } = await supabase
        .from('chat_sessions_v2')
        .select('metadata')
        .eq('session_id', inquiry.session_id)
        .single();
      const md: any = originalSession?.metadata;
      let issueDetails =
        md?.context?.issue_details || md?.issue_details || customerDescription;

      // Filter out quick reply options like "No, continue without image" and "No, let's continue" from JSONB flow
      if (issueDetails && typeof issueDetails === 'string') {
        const lines = issueDetails.split('\n').filter(line => {
          const trimmed = line.trim();
          if (!trimmed) return true; // Keep empty lines
          // Filter out "No, continue without image" and "No, let's continue" quick reply options
          if (/^no,?\s*continue\s+without\s+image$/i.test(trimmed)) {
            return false;
          }
          if (/^no,?\s*lets?\s*continue/i.test(trimmed)) {
            return false;
          }
          return true;
        });
        customerDescription = lines.join('\n').trim() || customerDescription;
      } else {
        customerDescription = issueDetails || customerDescription;
      }

      // Fetch initial images from original session
      const { data: originalMsgs } = await supabase.rpc(
        'api_fetch_chat_messages_v2',
        { p_session_id: inquiry.session_id }
      );
      if (originalMsgs && Array.isArray(originalMsgs)) {
        const initialImageMsgs = originalMsgs.filter(
          (msg: any) =>
            msg.sender_role === 'customer' &&
            msg.node_id === 'upload_image_instructions' &&
            typeof msg.message_text === 'string' &&
            msg.message_text.startsWith('supabase://')
        );
        if (initialImageMsgs.length > 0) {
          const imageUrls = initialImageMsgs.map((m: any) =>
            m.message_text.trim()
          );
          customerDescription += '\n\n' + imageUrls.join('\n');
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
        orderInfo = `\n\nRelated Order: ${orderData.display_id}\nStatus: ${formatOrderStatus(orderData.status)}\nAmount: ₱${orderData.total_amount}`;
      }
    }

    // Build ticket info display
    const customerName = inquiry.customer
      ? `${(inquiry.customer as any).first_name} ${(inquiry.customer as any).last_name}`
      : 'Unknown';

    // Build ticket info display based on status (header will be emitted separately)

    // Fetch replies from reply sessions per TICKET_REPLY_SESSION_LOGIC
    // Match customer trackTicket logic: fetch ALL reply sessions for this inquiry
    // (both admin and customer replies, regardless of who created them)
    // Note: Removed customer_id filter to match customer trackTicket behavior exactly
    // This ensures we fetch ALL reply sessions for the inquiry, not just those
    // with a specific customer_id (which might cause issues with RLS or admin-created sessions)
    const { data: ticketConversations, error: ticketError } = await supabase
      .from('chat_sessions_v2')
      .select('session_id')
      .eq('metadata->>inquiry_id', inquiryId)
      .eq('metadata->>ticket_conversation', true);

    if (ticketError) {
      console.error(
        '[fetchTicketForAdmin] Error fetching ticket conversations:',
        ticketError
      );
    }

    let ticketMessages: any[] = [];
    if (!ticketError && ticketConversations && ticketConversations.length > 0) {
      for (const ticketSession of ticketConversations) {
        const { data: ticketChatMessages, error: messagesError } =
          await supabase.rpc('api_fetch_chat_messages_v2', {
            p_session_id: ticketSession.session_id,
          });
        if (messagesError) {
          console.error(
            `[fetchTicketForAdmin] Error fetching messages for session ${ticketSession.session_id}:`,
            messagesError
          );
          continue;
        }
        if (ticketChatMessages && Array.isArray(ticketChatMessages)) {
          ticketMessages.push(...ticketChatMessages);
        }
      }
    }

    // Store reply messages - each will be in its own bubble
    const replyMessages: Array<{
      id: string;
      role: 'printy';
      text: string;
      ts: number;
      isHistorical: boolean;
    }> = [];

    if (ticketMessages.length > 0) {
      const relevantMessages = ticketMessages.filter(
        (msg: any) =>
          msg.sender_role === 'customer' || msg.sender_role === 'admin'
      );

      const seenMessages = new Set<string>();
      const uniqueMessages: any[] = [];
      for (const msg of relevantMessages) {
        let decryptedText = msg.message_text || '[No message content]';
        if (
          typeof decryptedText === 'string' &&
          decryptedText.startsWith('{"0":')
        ) {
          try {
            const jsonData = JSON.parse(decryptedText);
            const charCodes = Object.values(jsonData) as number[];
            decryptedText = String.fromCharCode(...charCodes);
          } catch {
            continue;
          }
        }
        const key = `${msg.sender_role}:${decryptedText}`;
        if (!seenMessages.has(key)) {
          seenMessages.add(key);
          uniqueMessages.push({ ...msg, decryptedText });
        }
      }

      uniqueMessages.sort(
        (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
      );

      // Extract admin sender IDs from metadata for batch lookup
      const adminIds = new Set<string>();
      for (const msg of uniqueMessages) {
        if (msg.sender_role === 'admin' && msg.metadata?.sender_id) {
          adminIds.add(msg.metadata.sender_id);
        }
      }

      // Fetch admin user info for all admin messages
      const adminInfoMap = await getAdminUserInfoBatch(Array.from(adminIds));

      // Create a separate message bubble for each message (no grouping)
      for (const msg of uniqueMessages) {
        const date = formatShortDate(msg.sent_at);
        const time = formatShortTime(msg.sent_at);
        const dateTime = `${date} • ${time}`;
        let sender: string;

        if (msg.sender_role === 'customer') {
          sender = 'Customer';
        } else {
          // For admin messages, try to get the admin's name from metadata
          const senderId = msg.metadata?.sender_id;
          if (senderId && adminInfoMap.has(senderId)) {
            const adminInfo = adminInfoMap.get(senderId)!;
            sender = `Admin ${adminInfo.fullName}`;
          } else {
            sender = 'Admin';
          }
        }

        const lines = String(msg.decryptedText || '')
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);
        const textLines = lines.filter(l => !l.startsWith('supabase://'));
        const imageLines = lines.filter(l => l.startsWith('supabase://'));

        const parts: string[] = [];
        parts.push(`${sender} (${dateTime}):`);
        if (textLines.length > 0) parts.push(textLines.join('\n'));
        if (imageLines.length > 0) parts.push(imageLines.join('\n'));

        replyMessages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: parts.join('\n'),
          ts: new Date(msg.sent_at).getTime(),
          isHistorical: true,
        });
      }
    }

    // Header bubble
    const header = [
      `Ticket ID: ${inquiry.display_id}`,
      `Customer: ${customerName}`,
      `Status: ${formatStatus(inquiry.inquiry_status)}`,
      `Received: ${formatShortDate(inquiry.received_at)}`,
      `\nInquiry type: ${formatInquiryType(inquiry.inquiry_type)}${orderInfo}`,
    ].join('\n');

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: header,
      ts: Date.now(),
      isHistorical: true,
    });

    // First conversation bubble: original customer details + initial images
    const customerDate = formatShortDate(inquiry.received_at);
    const customerTime = formatShortTime(inquiry.received_at);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: `Customer (${customerDate} • ${customerTime}):\n${customerDescription}`,
      ts: Date.now(),
      isHistorical: true,
    });

    // Append reply messages - each in its own bubble
    if (replyMessages.length > 0) {
      messages.push(...replyMessages);
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'What would you like to do?',
      ts: Date.now(),
      isHistorical: true,
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
      isHistorical: true,
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
