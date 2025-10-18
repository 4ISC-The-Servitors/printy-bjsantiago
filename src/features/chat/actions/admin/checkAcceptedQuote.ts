/**
 * Action handler: check_accepted_quote
 *
 * Checks if the quote associated with the session has been accepted by the customer.
 * This is a prerequisite check for the admin-create-order flow.
 *
 * @description
 * - Checks the quote status in the quotes table
 * - Verifies that the quote status is 'accepted'
 * - Stores the quote status in context for conditional flow logic
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing quote_id
 *
 * @returns ActionExecutionResult with quote status information
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function checkAcceptedQuote(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { context } = params;

  try {
    // Get quote_id from context
    const quoteId = context.quote_id;

    if (!quoteId) {
      return {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Quote ID not found in session context',
            ts: Date.now(),
          },
        ],
      };
    }

    // Get quote status
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('status, display_id')
      .eq('quote_id', quoteId)
      .single();

    if (quoteError || !quote) {
      console.error('[checkAcceptedQuote] Error fetching quote:', quoteError);
      return {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Could not find quote information',
            ts: Date.now(),
          },
        ],
      };
    }

    console.log('[checkAcceptedQuote] Quote status:', quote.status);

    // Store quote status in context for conditional evaluation
    const quoteStatus =
      quote.status === 'accepted' ? 'accepted' : 'not_accepted';

    // For accepted quotes, we don't need to show the status message
    // The flow will proceed directly to the greet node
    if (quote.status === 'accepted') {
      return {
        messages: [], // No message needed, flow will proceed automatically
        context: { quote_status: quoteStatus },
      };
    }

    return {
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: `Quote ${quote.display_id} status: ${quote.status}`,
          ts: Date.now(),
        },
      ],
      context: { quote_status: quoteStatus },
    };
  } catch (error) {
    console.error('[checkAcceptedQuote] Unexpected error:', error);
    return {
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'An unexpected error occurred while checking quote status',
          ts: Date.now(),
        },
      ],
    };
  }
}
