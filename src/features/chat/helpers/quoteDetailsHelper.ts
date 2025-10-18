/**
 * Shared helper functions for fetching and formatting quote details
 *
 * This module consolidates duplicate logic from customer and admin quote detail actions,
 * improving code maintainability and consistency.
 *
 * Performance Note: These helpers also optimize data fetching by reducing redundant queries
 * through proper data structure and field selection.
 */

import { supabase } from '@lib/supabase';

export interface QuoteDetailsData {
  originalRequest: string;
  hasProposal: boolean;
  proposal: {
    proposalId: string;
    specFinal: any;
    quotedPrice: number;
    status: string;
    notes: string;
    createdAt: string;
  } | null;
}

/**
 * Fetch original customer messages from a quote session
 */
export async function fetchOriginalCustomerRequest(
  sessionId: string
): Promise<string> {
  try {
    const { data: allMessages, error } = await supabase.rpc(
      'api_fetch_chat_messages_v2',
      { p_session_id: sessionId }
    );

    if (error || !allMessages || !Array.isArray(allMessages)) {
      console.error(
        '[fetchOriginalCustomerRequest] Error fetching messages:',
        error
      );
      return 'No original request found.';
    }

    const customerOnlyMessages = (allMessages as any[]).filter(
      (m: any) => m.sender_role === 'customer'
    );

    if (customerOnlyMessages.length === 0) {
      return 'No original request found.';
    }

    return customerOnlyMessages.map((m: any) => m.message_text).join('\n');
  } catch (error) {
    console.error('[fetchOriginalCustomerRequest] Unexpected error:', error);
    return 'No original request found.';
  }
}

/**
 * Fetch latest proposal for a quote session
 */
export async function fetchLatestProposal(
  sessionId: string
): Promise<QuoteDetailsData['proposal']> {
  try {
    const { data: proposals, error } = await supabase
      .from('quote_proposals')
      .select(
        `
        proposal_id,
        spec_final,
        quoted_price,
        status,
        notes,
        created_at
      `
      )
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !proposals || proposals.length === 0) {
      return null;
    }

    const proposal = proposals[0];
    return {
      proposalId: proposal.proposal_id,
      specFinal: proposal.spec_final || {},
      quotedPrice: proposal.quoted_price,
      status: proposal.status,
      notes: proposal.notes || '',
      createdAt: proposal.created_at,
    };
  } catch (error) {
    console.error('[fetchLatestProposal] Unexpected error:', error);
    return null;
  }
}

/**
 * Fetch complete quote details (original request + latest proposal)
 * This function combines both queries for convenience
 */
export async function fetchCompleteQuoteDetails(
  sessionId: string
): Promise<QuoteDetailsData> {
  const [originalRequest, proposal] = await Promise.all([
    fetchOriginalCustomerRequest(sessionId),
    fetchLatestProposal(sessionId),
  ]);

  return {
    originalRequest,
    hasProposal: proposal !== null,
    proposal,
  };
}

/**
 * Format proposal specifications into a readable text format
 */
export function formatProposalSpecs(
  specData: any,
  adminNotes?: string
): string[] {
  const lines: string[] = [];

  if (specData.product_name) {
    lines.push(`• Product: ${specData.product_name}`);
  }

  if (specData.category) {
    lines.push(`• Category: ${specData.category}`);
  }

  if (specData.description) {
    lines.push(`• Description: ${specData.description}`);
  }

  if (specData.size) {
    lines.push(`• Size: ${specData.size}`);
  }

  if (Array.isArray(specData.materials) && specData.materials.length > 0) {
    lines.push(`• Materials: ${specData.materials.join(', ')}`);
  }

  if (specData.color) {
    lines.push(`• Color: ${specData.color}`);
  }

  if (Array.isArray(specData.finishing) && specData.finishing.length > 0) {
    lines.push(`• Finishing: ${specData.finishing.join(', ')}`);
  }

  if (specData.quantity) {
    lines.push(`• Quantity: ${specData.quantity}`);
  }

  if (specData.deadline) {
    lines.push(`• Deadline: ${specData.deadline}`);
  }

  if (specData.notes) {
    lines.push(`• Notes: ${specData.notes}`);
  }

  if (adminNotes) {
    lines.push(`• Admin Notes: ${adminNotes}`);
  }

  return lines;
}

/**
 * Format complete quote details for customer view
 */
export function formatQuoteDetailsForCustomer(
  quoteDetails: QuoteDetailsData
): string {
  let text = `Your Original Request:\n\n${quoteDetails.originalRequest}`;

  if (quoteDetails.hasProposal && quoteDetails.proposal) {
    const proposalLines = formatProposalSpecs(
      quoteDetails.proposal.specFinal,
      quoteDetails.proposal.notes
    );

    text += '\n\nAdmin Proposal:\n';
    text += proposalLines.join('\n');
    text += `\n\nQuoted Price: ₱${quoteDetails.proposal.quotedPrice}`;
  } else {
    text +=
      '\n\nYour quote request is being reviewed by our admin team. We will send you a detailed proposal with pricing soon.';
  }

  return text;
}

/**
 * Format complete quote details for admin view
 */
export function formatQuoteDetailsForAdmin(
  quoteDetails: QuoteDetailsData
): string {
  let text = `Original Customer Request:\n\n${quoteDetails.originalRequest}`;

  if (quoteDetails.hasProposal && quoteDetails.proposal) {
    const proposalLines = formatProposalSpecs(
      quoteDetails.proposal.specFinal,
      quoteDetails.proposal.notes
    );

    text += '\n\nLatest Draft/Proposal:\n';
    text += proposalLines.join('\n');

    if (quoteDetails.proposal.quotedPrice != null) {
      text += `\n• Quoted Price: ₱${quoteDetails.proposal.quotedPrice}`;
    }
  }

  return text;
}
