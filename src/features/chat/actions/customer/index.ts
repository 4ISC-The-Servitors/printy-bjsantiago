/**
 * Action Registry
 * Maps action names to their handler functions
 */

import type { ActionHandler } from '../../types';
import { verifyOrder } from './verifyOrder';
import { uploadPaymentProof } from './uploadPaymentProof';
import { acceptQuoteProposal } from './acceptQuoteProposal';
import { rejectQuoteProposal } from './rejectQuoteProposal';
import { displayQuoteDetails } from './displayQuoteDetails';
import { createQuoteConversation } from './createQuoteConversation';
import { createInquiry } from './createInquiry';

/**
 * Registry of all available action handlers
 */
export const actionHandlers: Record<string, ActionHandler> = {
  verify_order: verifyOrder,
  display_quote_details: displayQuoteDetails,
  upload_payment_proof: uploadPaymentProof,
  accept_quote_proposal: acceptQuoteProposal,
  reject_quote_proposal: rejectQuoteProposal,
  create_quote_conversation: createQuoteConversation,
  create_inquiry: createInquiry,
};

/**
 * Execute an action by name
 */
export {
  verifyOrder,
  uploadPaymentProof,
  displayQuoteDetails,
  acceptQuoteProposal,
  rejectQuoteProposal,
  createQuoteConversation,
  createInquiry,
};
