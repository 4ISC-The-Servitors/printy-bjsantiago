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
import { formatShortTime } from '@shared/utils/timeFormatter';
import { formatInquiryType } from '@shared/utils/statusFormatter';
import { insertMessageV2 } from '@features/chat/api/jsonbChatFlowApi';
import { getAdminUserInfoBatch } from '@features/chat/utils/admin/getAdminUserId';

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
    isHistorical?: boolean;
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
        isHistorical: true,
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
        isHistorical: true,
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
        isHistorical: true,
      });
      return { messages };
    }

    // We no longer fetch any other conversation messages. Only show the original
    // issue details captured on inquiry creation.
    const originalSessionId = inquiry.session_id;

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

    // Header bubble
    const headerText = [
      `Ticket ID: ${inquiry.display_id}`,
      `Type: ${formatInquiryType(inquiry.inquiry_type)}`,
      `Status: ${formatStatus(inquiry.inquiry_status)}`,
      inquiry.order_id ? `Related Order: ${orderDisplayId}` : undefined,
      `Created: ${formatShortDate(inquiry.received_at)}`,
    ]
      .filter(Boolean)
      .join('\n');

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: headerText,
      ts: Date.now(),
      isHistorical: true,
    });

    // Prepare a fresh accumulator for per-bubble texts
    let conversationText = '';

    // Only show the original issue details submitted by the customer.
    // The initial details are stored on the original session metadata under context.issue_details
    let initialDetails = 'No details provided.';
    if (originalSessionId) {
      const { data: originalSession, error: originalSessionError } =
        await supabase
          .from('chat_sessions_v2')
          .select('metadata')
          .eq('session_id', originalSessionId)
          .single();

      if (!originalSessionError && originalSession?.metadata) {
        const md: any = originalSession.metadata;
        initialDetails =
          md?.context?.issue_details || md?.issue_details || initialDetails;
      }
    }
    const receivedDate = formatShortDate(inquiry.received_at);
    const receivedTime = formatShortTime(inquiry.received_at);
    conversationText += `You (${receivedDate} • ${receivedTime}):\n`;
    conversationText += `${initialDetails}`;

    // Include any images uploaded during the initial ticket creation from the
    // original session. We only extract image URLs; no other texts.
    if (originalSessionId) {
      const { data: originalMsgs } = await supabase.rpc(
        'api_fetch_chat_messages_v2',
        { p_session_id: originalSessionId }
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
          conversationText += `\n${imageUrls.join('\n')}`;
        }
      }
    }
    // Push first bubble (original details + images)
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: conversationText,
      ts: Date.now(),
      isHistorical: true,
    });
    conversationText = '';

    // Restore critical aggregation: include messages from all ticket reply sessions
    // linked to this inquiry (admin and customer replies), sorted chronologically.
    const { data: ticketConversations, error: ticketError } = await supabase
      .from('chat_sessions_v2')
      .select('session_id')
      .eq('metadata->>inquiry_id', inquiryId)
      .eq('metadata->>ticket_conversation', true);

    let ticketMessages: any[] = [];
    if (!ticketError && ticketConversations && ticketConversations.length > 0) {
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

    // Show only customer/admin reply messages from reply sessions
    if (ticketMessages.length > 0) {
      const relevantMessages = ticketMessages.filter(
        (msg: any) =>
          msg.sender_role === 'customer' || msg.sender_role === 'admin'
      );

      // Deduplicate by sender+content after decrypting
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

        const messageKey = `${msg.sender_role}:${decryptedText}`;
        if (!seenMessages.has(messageKey)) {
          seenMessages.add(messageKey);
          uniqueMessages.push({ ...msg, decryptedText });
        }
      }

      // Sort chronologically then emit one bubble per message (no grouping by sender)
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

      for (const msg of uniqueMessages) {
        const msgDate = formatShortDate(msg.sent_at);
        const msgTime = formatShortTime(msg.sent_at);
        const dateTime = `${msgDate} • ${msgTime}`;
        let sender: string;

        if (msg.sender_role === 'customer') {
          sender = 'You';
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
        const textMessages = lines.filter(t => !t.startsWith('supabase://'));
        const imageUrls = lines.filter(t => t.startsWith('supabase://'));
        const parts: string[] = [];
        parts.push(`${sender} (${dateTime}):`);
        if (textMessages.length > 0) parts.push(textMessages.join('\n'));
        if (imageUrls.length > 0) parts.push(imageUrls.join('\n'));
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: parts.join('\n'),
          ts: Date.now(),
          isHistorical: true,
        });
      }
    }
    return { messages };
  } catch (error) {
    console.error('Error in fetchTicketDetails:', error);
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
    isHistorical?: boolean;
  }> = [];

  const customerReply = String(context['customer_reply'] || '');
  const uploadedImageRaw =
    context['uploaded_image_url'] || context['user_input'] || '';
  const uploadErrors: string[] = Array.isArray(context['upload_error_messages'])
    ? (context['upload_error_messages'] as string[])
    : [];
  const expectsImageReply = Boolean(
    context['expects_image_reply'] === true ||
      context['reply_mode'] === 'image' ||
      context['wants_image_upload'] === 'yes'
  );

  // Normalize uploaded image input to an array of supabase:// urls
  const normalizeToUrlArray = (value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String);
    const str = String(value).trim();
    // Try JSON parse first if it looks like an array
    if (str.startsWith('[') && str.endsWith(']')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) return parsed.map((v: any) => String(v));
      } catch {}
    }
    // If multiple URLs accidentally concatenated with commas and quotes, split them
    if (
      str.includes('supabase://') &&
      (str.includes(',') || str.includes('%22'))
    ) {
      return str
        .replaceAll('%22', '"')
        .split(',')
        .map(s => s.replaceAll('"', '').trim())
        .filter(s => s.startsWith('supabase://'));
    }
    return str.startsWith('supabase://') ? [str] : [];
  };

  const uploadedImageUrls: string[] = normalizeToUrlArray(uploadedImageRaw);
  const rawString = String(uploadedImageRaw || '');
  const explicitUploadFailure =
    uploadErrors.length > 0 ||
    /Upload failed|No files selected|maximu[mn] of 3 images/i.test(rawString);
  const hasAttachment = uploadedImageUrls.length > 0;

  // If this step expects an image reply, do not proceed on failed/empty upload
  if (expectsImageReply && (!hasAttachment || explicitUploadFailure)) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text:
        uploadErrors[0] ||
        'No image selected. Please upload up to 3 images and try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  // Otherwise, require either a text reply OR an image upload
  if (!customerReply.trim() && !hasAttachment) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Please attach an image or enter a reply.',
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
      console.error(
        '[sendCustomerReply] Missing session_id or customer_id in inquiry'
      );
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
          title: ticketDisplayId
            ? `Track Ticket: ${ticketDisplayId}`
            : 'Track Ticket',
          ticket_conversation: true,
          original_session_id: originalSessionId,
          inquiry_id: inquiryId,
          conversation_type: 'ticket_reply',
          customer_chat: true,
        },
      })
      .select('session_id')
      .single();

    if (sessionError || !ticketSession?.session_id) {
      console.error(
        'Error creating ticket conversation session for customer reply:',
        sessionError
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Failed to create conversation session. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Store customer reply in the ticket conversation session
    // For attachments, include the URL in the message text so it persists and is extractable
    // This matches the payment proof pattern where URLs are in the message text
    let messageText = customerReply.trim();
    if (hasAttachment) {
      if (!messageText) {
        messageText = 'Uploaded image(s):';
      }
      // Put each storage URL on its own line so the renderer can sign individually
      messageText = `${messageText}\n${uploadedImageUrls.join('\n')}`;
    }

    const result = await insertMessageV2({
      sessionId: ticketSession.session_id,
      text: messageText,
      role: 'customer',
      nodeId: 'customer_reply',
      metadata: hasAttachment
        ? {
            has_attachment: true,
            attachment_urls: uploadedImageUrls,
          }
        : undefined,
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
      console.error(
        '[sendCustomerReply] Error updating inquiry status:',
        statusError
      );
    }

    // Notifications are handled by database trigger (notify_ticket_events)
    // This bypasses RLS and prevents policy violations

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Your reply has been sent to our support team.',
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
    isHistorical?: boolean;
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
      console.error(
        '[resolveTicket] No customer_id found for inquiry:',
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
          customer_chat: true,
        },
      })
      .select('session_id')
      .single();

    if (sessionError || !ticketSession?.session_id) {
      console.error(
        'Error creating ticket conversation session for resolution:',
        sessionError
      );
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

    // Notifications are handled by database trigger (notify_ticket_events)
    // This bypasses RLS and prevents policy violations

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
