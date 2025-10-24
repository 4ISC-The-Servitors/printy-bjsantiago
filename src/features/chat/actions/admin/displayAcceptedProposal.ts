/**
 * Action handler: display_accepted_proposal
 *
 * Displays the accepted quote proposal details to the admin.
 * Shows the final specifications that were accepted by the customer.
 *
 * @description
 * - Retrieves the accepted proposal and its specifications
 * - Formats the proposal details for display
 * - Shows product name, specifications, and notes
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context containing proposal_id
 * @param params.sessionId - Current admin chat session ID
 * @param params.customerId - Customer ID (not used in this action)
 *
 * @returns ActionExecutionResult with formatted proposal details
 */

import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

export async function displayAcceptedProposal(
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

    // Get the accepted proposal with specifications
    const { data: proposal, error: proposalError } = await supabase
      .from('quote_proposals')
      .select(
        `
        proposal_id,
        spec_final,
        quoted_price,
        notes,
        created_at,
        quote_proposals:spec_id (
          spec_data
        )
      `
      )
      .eq('proposal_id', proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error(
        '[displayAcceptedProposal] Error fetching proposal:',
        proposalError
      );
      return {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Could not find accepted proposal',
            ts: Date.now(),
          },
        ],
      };
    }

    // Get the final specs (use spec_final if available, otherwise use original spec_data)
    const specs =
      proposal.spec_final ||
      (Array.isArray(proposal.quote_proposals) &&
        proposal.quote_proposals[0]?.spec_data) ||
      {};

    // Format the proposal details
    const messages = [
      'Accepted Proposal Details:',
      '',
      `Product: ${specs.product_name || 'N/A'}`,
      `Description: ${specs.description || 'N/A'}`,
      `Category: ${specs.category || 'N/A'}`,
      `Quantity: ${specs.quantity || 'N/A'}`,
      `Size: ${specs.size || 'N/A'}`,
      `Color: ${specs.color || 'N/A'}`,
    ];

    // Add materials if available
    if (
      specs.materials &&
      Array.isArray(specs.materials) &&
      specs.materials.length > 0
    ) {
      messages.push(`Materials: ${specs.materials.join(', ')}`);
    }

    // Add finishing if available
    if (
      specs.finishing &&
      Array.isArray(specs.finishing) &&
      specs.finishing.length > 0
    ) {
      messages.push(`Finishing: ${specs.finishing.join(', ')}`);
    }

    // Add other specifications if available
    if (
      specs.others &&
      Array.isArray(specs.others) &&
      specs.others.length > 0
    ) {
      messages.push(`Other Specs: ${specs.others.join(', ')}`);
    }

    messages.push(
      `Deadline: ${specs.deadline || 'N/A'}`,
      `Artwork: ${specs.artwork || 'N/A'}`,
      ''
    );

    // Add notes if available
    if (proposal.notes) {
      messages.push(`Admin Notes: ${proposal.notes}`);
    }

    console.log(
      '[displayAcceptedProposal] Displaying proposal:',
      proposal.proposal_id
    );

    return {
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: messages.join('\n'),
          ts: Date.now(),
        },
      ],
    };
  } catch (error) {
    console.error('[displayAcceptedProposal] Unexpected error:', error);
    return {
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'An unexpected error occurred while displaying proposal details',
          ts: Date.now(),
        },
      ],
    };
  }
}
