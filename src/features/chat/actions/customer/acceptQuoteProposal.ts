/**
 * Action handler: accept_quote_proposal
 *
 * Accepts a quote proposal by updating the quote status to 'accepted'.
 * This action updates only the quotes table (single source of truth for status).
 *
 * @description
 * - Retrieves the conversation ID from session context
 * - Updates quotes status to 'accepted'
 * - Logs the acceptance for audit purposes
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing conversation_id
 * @param params.sessionId - Current chat session ID
 * @param params.customerId - Customer performing the action
 *
 * @returns ActionExecutionResult with error message if conversation not found, empty messages otherwise
 *
 * @example
 * ```json
 * // Flow definition usage
 * {
 *   "id": "accept_node",
 *   "type": "action",
 *   "action": "accept_quote_proposal",
 *   "action_config": {
 *     "conversation_id_key": "conversation_id"
 *   },
 *   "next": "confirmation_node"
 * }
 * ```
 */
import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function acceptQuoteProposal(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  console.log('[acceptQuoteProposal] Action called with params:', params);
  const { actionNode, context } = params;
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  const config = actionNode.action_config as any;
  const conversationIdKey = config.conversation_id_key || 'conversation_id';
  let conversationId = String(context[conversationIdKey] || '').trim();

  if (!conversationId) {
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Quote conversation not found. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }

  // If conversationId is a quote_id, we need to find the actual session_id
  if (conversationId && conversationId.length > 30) {
    console.log(
      '[acceptQuoteProposal] conversationId looks like quote_id, finding session_id...'
    );

    // Query quotes table to get the session_id for this quote
    const { data: quoteData } = await supabase
      .from('quotes')
      .select('session_id')
      .eq('quote_id', conversationId)
      .single();

    if (quoteData?.session_id) {
      conversationId = quoteData.session_id;
      console.log('[acceptQuoteProposal] Found session_id:', conversationId);
    } else {
      console.error(
        '[acceptQuoteProposal] No session_id found for quote_id:',
        conversationId
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Quote not found. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }
  }

  try {
    // Update quotes status to 'accepted'
    console.log(
      '[acceptQuoteProposal] Updating quotes for session_id:',
      conversationId
    );

    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
        updated_by: params.customerId, // Track that customer accepted the quote
      })
      .eq('session_id', conversationId)
      .select();

    console.log('[acceptQuoteProposal] quotes update result:', {
      data: quoteData,
      error: quoteError,
      count: quoteData?.length,
    });

    if (quoteError) {
      console.error('Error updating quotes:', quoteError);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Error accepting quote. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    if (!quoteData || quoteData.length === 0) {
      console.warn(
        '[acceptQuoteProposal] No quotes found for session_id:',
        conversationId
      );
    }

    console.log(
      '[AcceptQuote] Quote proposal accepted for conversation:',
      conversationId
    );

    // Create notifications for admins
    try {
      // Get customer name for notification message
      const { data: customerData } = await supabase
        .from('customer')
        .select('first_name, last_name')
        .eq('customer_id', params.customerId)
        .single();

      const customerName =
        customerData?.first_name && customerData?.last_name
          ? `${customerData.first_name} ${customerData.last_name}`
          : 'Customer';

      // Get quote display_id for notification
      const quoteDisplayId = quoteData?.[0]?.display_id || 'Unknown';

      // Get all admin users using RPC (bypasses RLS)
      const { data: admins, error: adminError } = await supabase.rpc(
        'get_admin_customer_ids'
      );

      console.log('[AcceptQuote] Admin query result:', {
        admins,
        adminError,
        count: admins?.length,
      });

      if (admins && admins.length > 0) {
        // Create notification for each admin
        const notifications = admins.map((admin: { customer_id: string }) => ({
          customer_id: admin.customer_id,
          source_type: 'quote',
          source_id: quoteData?.[0]?.quote_id,
          title: 'Quote Accepted',
          message: `Quote #${quoteDisplayId} was accepted by ${customerName}.`,
          type: 'warning',
          category: 'quote',
        }));

        console.log(
          '[AcceptQuote] Attempting to insert notifications:',
          notifications
        );

        const { data: insertedNotifs, error: notifError } = await supabase
          .from('notifications')
          .insert(notifications)
          .select();

        console.log('[AcceptQuote] Notification insert result:', {
          insertedNotifs,
          notifError,
        });

        if (notifError) {
          console.error(
            '[AcceptQuote] Error creating admin notifications:',
            notifError
          );
        } else {
          console.log(
            '[AcceptQuote] Created notifications for',
            admins.length,
            'admins'
          );
        }
      }
    } catch (notifErr) {
      console.error('[AcceptQuote] Error in notification creation:', notifErr);
      // Don't fail the whole action if notifications fail
    }

    // Return success message with End Chat option
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Great! You have accepted the quote proposal. Our admin will create your order and you will be instructed to pay for it before your order gets processed.',
      ts: Date.now(),
    });

    return {
      messages,
      quickReplies: [
        {
          label: 'End Chat',
          value: 'end',
          next: 'end',
        },
      ],
    };
  } catch (error) {
    console.error('Error accepting quote proposal:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Error accepting quote proposal. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
}
