/**
 * Action Registry
 * Maps action names to their handler functions
 */

import type { ActionHandler } from '@features/chat/types';
import { displayQuoteDetailsAdmin } from './displayQuoteDetailsAdmin';
import { aiSummarizeSpecs } from './aiSummarizeSpecs';
import { sendQuoteProposal } from './sendQuoteProposal';
import { manualOrderSpecs } from './manualOrderSpecs';
import { editSavedSpecs } from './editSavedSpecs';
import { checkExistingSpecs } from './checkExistingSpecs';
import { dynamicChooseAction } from './dynamicChooseAction';
import { createOrder } from './createOrder';
import { checkAcceptedQuote } from './checkAcceptedQuote';
import { displayAcceptedProposal } from './displayAcceptedProposal';
import { displayQuotePrice } from './displayQuotePrice';
import { displayOrderSpecs } from './displayOrderSpecs';
import { displayOrderPrice } from './displayOrderPrice';
import { displayPaymentProof } from './displayPaymentProof';
import { verifyPayment } from './verifyPayment';
import { verifyPaymentValued } from './verifyPaymentValued';
import { denyPayment } from './denyPayment';
import { sendAdminReply } from './replyToTicket';
import { ticketChangeStatus } from './changeTicketStatus';
import { fetchTicketForAdmin } from './fetchTicketForAdmin';
import { displayOrderUploadsAdmin } from './displayOrderUploads';
import { changeOrderStatus } from './changeOrderStatus';

/**
 * Registry of all available action handlers
 */
export const actionHandlers: Record<string, ActionHandler> = {
  display_quote_details_admin: displayQuoteDetailsAdmin,
  ai_summarize_specs: aiSummarizeSpecs,
  send_quote_proposal: sendQuoteProposal,
  manual_order_specs: manualOrderSpecs,
  edit_saved_specs: editSavedSpecs,
  check_existing_specs: checkExistingSpecs,
  dynamic_choose_action: dynamicChooseAction,
  create_order: createOrder,
  check_accepted_quote: checkAcceptedQuote,
  display_accepted_proposal: displayAcceptedProposal,
  display_quote_price: displayQuotePrice,
  display_order_specs: displayOrderSpecs,
  display_order_price: displayOrderPrice,
  display_order_uploads_admin: displayOrderUploadsAdmin,
  display_payment_proof: displayPaymentProof,
  verify_payment: verifyPayment,
  verify_payment_valued: verifyPaymentValued,
  deny_payment: denyPayment,
  change_order_status: changeOrderStatus,
  send_admin_reply: sendAdminReply,
  ticket_change_status: ticketChangeStatus,
  fetch_ticket_for_admin: fetchTicketForAdmin,
};

/**
 * Execute an action by name
 */
export {
  aiSummarizeSpecs,
  sendQuoteProposal,
  manualOrderSpecs,
  editSavedSpecs,
  checkExistingSpecs,
  dynamicChooseAction,
  createOrder,
  checkAcceptedQuote,
  displayAcceptedProposal,
  displayQuotePrice,
  displayOrderSpecs,
  displayOrderPrice,
  displayPaymentProof,
  verifyPayment,
  verifyPaymentValued,
  denyPayment,
  changeOrderStatus,
  sendAdminReply,
  ticketChangeStatus,
  fetchTicketForAdmin,
  displayOrderUploadsAdmin,
};
