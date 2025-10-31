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
    if (str.startsWith('[') && str.endsWith(']')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) return parsed.map((v: any) => String(v));
      } catch {}
    }
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
  if (!adminReply.trim() && !hasAttachment) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Please attach an image or enter a reply.',
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
    // Get customer_id and original session info
    let customerId = null;
    let originalSessionId = customerSessionId;
    let ticketDisplayId = null;

    if (customerSessionId) {
      const { data: originalSession } = await supabase
        .from('chat_sessions_v2')
        .select('customer_id')
        .eq('session_id', customerSessionId)
        .single();
      customerId = originalSession?.customer_id;
    } else if (inquiryId) {
      // Fallback: get both from inquiry
      const { data: inquiry } = await supabase
        .from('inquiries_v2')
        .select('customer_id, session_id, display_id')
        .eq('inquiry_id', inquiryId)
        .single();
      customerId = inquiry?.customer_id;
      originalSessionId = inquiry?.session_id;
      ticketDisplayId = inquiry?.display_id;
    }

    if (!customerId) {
      console.error('Could not find customer_id for admin reply');
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Customer information not found. Please try again.',
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
          admin_chat: true,
        },
      })
      .select('session_id')
      .single();

    if (sessionError || !ticketSession?.session_id) {
      console.error(
        'Error creating ticket conversation session for admin reply:',
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

    // Store admin reply in the ticket conversation session
    // For attachments, include the URL in the message text so it persists and is extractable
    // This matches the payment proof pattern where URLs are in the message text
    let messageText = adminReply.trim();
    if (hasAttachment) {
      if (!messageText) {
        messageText = 'Uploaded image(s):';
      }
      // Place each storage URL on its own line
      messageText = `${messageText}\n${uploadedImageUrls.join('\n')}`;
    }

    const result = await insertMessageV2({
      sessionId: ticketSession.session_id,
      text: messageText,
      role: 'admin',
      nodeId: 'admin_reply',
      metadata: hasAttachment
        ? {
            has_attachment: true,
            attachment_urls: uploadedImageUrls,
          }
        : undefined,
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
    if (inquiryId) {
      const { error: statusError } = await supabase
        .from('inquiries_v2')
        .update({
          inquiry_status: 'pending_customer_reply',
          updated_by: await getAdminUserId(), // Track that admin replied to ticket
        })
        .eq('inquiry_id', inquiryId);

      if (statusError) {
        console.error(
          '[sendAdminReply] Error updating inquiry status:',
          statusError
        );
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
