/**
 * Action Registry
 * Maps action names to their handler functions
 */

import type { ActionHandler } from '../types';
import { verifyOrder } from './verifyOrder';
import { uploadPaymentProof } from './uploadPaymentProof';
import { createQuoteConversation } from './createQuoteConversation';
import { createInquiry } from './createInquiry';
import { displayQuoteDetails } from './displayQuoteDetails';
import { displayQuoteDetailsAdmin } from './displayQuoteDetailsAdmin';
import { acceptQuoteProposal } from './acceptQuoteProposal';
import { rejectQuoteProposal } from './rejectQuoteProposal';
import { aiSummarizeSpecs } from './aiSummarizeSpecs';
import { sendQuoteProposal } from './sendQuoteProposal';

/**
 * Registry of all available action handlers
 */
export const actionHandlers: Record<string, ActionHandler> = {
  verify_order: verifyOrder,
  upload_payment_proof: uploadPaymentProof,
  create_quote_conversation: createQuoteConversation,
  create_inquiry: createInquiry,
  display_quote_details: displayQuoteDetails,
  display_quote_details_admin: displayQuoteDetailsAdmin,
  accept_quote_proposal: acceptQuoteProposal,
  reject_quote_proposal: rejectQuoteProposal,
  ai_summarize_specs: aiSummarizeSpecs,
  send_quote_proposal: sendQuoteProposal,
};

/**
 * Execute an action by name
 */
export { verifyOrder, uploadPaymentProof, createQuoteConversation, createInquiry, displayQuoteDetails, acceptQuoteProposal, rejectQuoteProposal, aiSummarizeSpecs, sendQuoteProposal };
