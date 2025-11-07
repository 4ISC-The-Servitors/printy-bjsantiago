/**
 * Action handler: display_original_request
 *
 * Displays the original customer request from the quote conversation.
 * This shows what the customer originally asked for before the admin proposal.
 *
 * @description
 * - Fetches original customer quote request messages from chat history
 * - Formats and displays the original request in a clean message
 * - Persists the formatted message to chat history
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing conversation_id
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Customer viewing the quote details
 *
 * @returns ActionExecutionResult with formatted original request message
 */
import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function displayOriginalRequest(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { actionNode, context, sessionId: _sessionId } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  const config = actionNode.action_config as any;
  const conversationIdKey = config.conversation_id_key || 'conversation_id';
  let conversationId = String(context[conversationIdKey] || '').trim();

  // If conversationId is a quote_id, we need to find the actual session_id
  if (conversationId && conversationId.length > 30) {
    // Query quotes table to get the session_id for this quote
    const { data: quoteData } = await supabase
      .from('quotes')
      .select('session_id')
      .eq('quote_id', conversationId)
      .single();

    if (quoteData?.session_id) {
      conversationId = quoteData.session_id;
    }
  }

  if (!conversationId) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Quote conversation not found. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  try {
    // Use the same RPC function that admin uses for proper decryption
    const { data: allMessages, error: msgError } = await supabase.rpc(
      'api_fetch_chat_messages_v2',
      { p_session_id: conversationId }
    );

    let originalRequestText = 'Your Original Request:\n\n';
    if (!msgError && allMessages && allMessages.length > 0) {
      const customerOnlyMessages = (allMessages as any[]).filter(
        (m: any) => m.sender_role === 'customer'
      );

      if (customerOnlyMessages.length > 0) {
        // Filter out order-uploads URLs and upload prompts so images render in a separate bubble
        const orderUploadRegex = /supabase:\/\/order-uploads\/[^\s,"')\]]+/gi;
        const uploadPromptPatterns = [
          /yes,?\s*upload\s+image/i,
          /upload\s+image/i,
          /attach\s+image/i,
        ];

        const cleaned = customerOnlyMessages
          .map((m: any) => {
            let text = String(m.message_text || '').trim();
            text = text.replace(orderUploadRegex, '').trim();
            const lines = text.split('\n').filter(line => {
              const trimmed = line.trim();
              if (!trimmed) return true; // Keep empty lines
              // Filter out quick reply options like "No, continue without image" from JSONB flow
              if (/^no,?\s*continue\s+without\s+image$/i.test(trimmed)) {
                return false;
              }
              return !uploadPromptPatterns.some(p => p.test(trimmed));
            });
            return lines.join('\n').trim();
          })
          .filter(Boolean);

        const requestText = cleaned.join('\n');
        originalRequestText += requestText || 'No original request found.';
      } else {
        originalRequestText += 'No original request found.';
      }
    } else {
      // Fallback to session metadata if available
      try {
        const { data: session } = await supabase
          .from('chat_sessions_v2')
          .select('metadata')
          .eq('session_id', conversationId)
          .single();
        let contextQuoteDetails = session?.metadata?.context?.quote_details as
          | string
          | undefined;

        // Filter out quick reply options like "No, continue without image" from JSONB flow
        if (contextQuoteDetails && typeof contextQuoteDetails === 'string') {
          const lines = contextQuoteDetails.split('\n').filter(line => {
            const trimmed = line.trim();
            if (!trimmed) return true; // Keep empty lines
            // Filter out "No, continue without image" quick reply option
            if (/^no,?\s*continue\s+without\s+image$/i.test(trimmed)) {
              return false;
            }
            return true;
          });
          contextQuoteDetails = lines.join('\n').trim();
        }

        originalRequestText +=
          contextQuoteDetails || 'No original request found.';
      } catch {
        originalRequestText += 'No original request found.';
      }
    }

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: originalRequestText,
      ts: Date.now(),
    });

    // ✅ FIX: Don't insert message here - JsonbFlowProcessor caller will handle it
    // This prevents duplicate messages in the database
  } catch (error) {
    console.error('Error displaying original request:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Error loading your original request. Please try again.',
      ts: Date.now(),
    });
  }

  return { messages };
}
