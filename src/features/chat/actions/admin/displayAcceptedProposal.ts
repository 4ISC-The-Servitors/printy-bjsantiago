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
import {
  buildSpecHeaderLines,
  buildSpecDetailLines,
} from '@features/chat/helpers/specDisplay';

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
    const header = await buildSpecHeaderLines({
      service_id: (specs as any)?.service_id,
      category: (specs as any)?.category,
    });
    const adminNotes = (specs as any)?.admin_notes || proposal.notes || '';
    const details = buildSpecDetailLines(specs as any, adminNotes);
    const messages = [
      'Accepted Proposal Details:',
      '',
      header.length > 0 ? header.join('\n') : '',
      ...details,
    ];

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
