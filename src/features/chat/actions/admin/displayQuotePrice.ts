/**
 * Action handler: display_quote_price
 *
 * Displays the quoted price from the accepted proposal.
 * Shows the final agreed price that the customer accepted.
 *
 * @description
 * - Retrieves the quoted price from the accepted proposal
 * - Formats the price with peso symbol
 * - Shows the final agreed amount
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing proposal_id
 *
 * @returns ActionExecutionResult with formatted price information
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';
import { formatCurrency } from '@shared/utils/priceFormatter';

export async function displayQuotePrice(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { context } = params;

  try {
    // Get proposal_id from context
    const proposalId = context.proposal_id;

    if (!proposalId) {
      return {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Proposal ID not found in session context',
            ts: Date.now(),
          },
        ],
      };
    }

    // Get the quoted price from the accepted proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('quote_proposals')
      .select('quoted_price, proposal_id')
      .eq('proposal_id', proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error(
        '[displayQuotePrice] Error fetching proposal:',
        proposalError
      );
      return {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Could not find accepted proposal price',
            ts: Date.now(),
          },
        ],
      };
    }

    const formattedPrice = formatCurrency(Number(proposal.quoted_price || 0));


    return {
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: `Agreed Quote Price: ${formattedPrice}`,
          ts: Date.now(),
        },
      ],
    };
  } catch (error) {
    console.error('[displayQuotePrice] Unexpected error:', error);
    return {
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'An unexpected error occurred while displaying quote price',
          ts: Date.now(),
        },
      ],
    };
  }
}
