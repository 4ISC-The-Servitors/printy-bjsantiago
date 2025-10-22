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
import { displayOriginalRequest } from './displayOriginalRequest';
import { displayProposalSpecs } from './displayProposalSpecs';
import { displayQuotedPrice } from './displayQuotedPrice';
import { createQuoteConversation } from './createQuoteConversation';
import { createInquiry } from './createInquiry';
import { displayOrderPaymentInfo } from './displayOrderPaymentInfo';
import { displayPaymentMethods } from './displayPaymentMethods';
import { uploadPaymentProofImage } from './uploadPaymentProofImage';
import { displayAcceptedSpecs } from './displayAcceptedSpecs';
import { displayBankTransferDetails } from './displayBankTransferDetails';
import { displayQRCodeDetails } from './displayQRCodeDetails';
import { processPaymentProofUpload } from './processPaymentProofUpload';
import { fetchDenialReason } from './fetchDenialReason';
import { reuploadPaymentProof } from './reuploadPaymentProof';
import { cancelOrder } from './cancelOrder';
import { fetchTicketDetails, sendCustomerReply, resolveTicket } from './trackTicket';
import { showCustomerOrders } from './showCustomerOrders';

/**
 * Registry of all available action handlers
 */
export const actionHandlers: Record<string, ActionHandler> = {
  verify_order: verifyOrder,
  display_quote_details: displayQuoteDetails,
  display_original_request: displayOriginalRequest,
  display_proposal_specs: displayProposalSpecs,
  display_quoted_price: displayQuotedPrice,
  upload_payment_proof: uploadPaymentProof,
  accept_quote_proposal: acceptQuoteProposal,
  reject_quote_proposal: rejectQuoteProposal,
  create_quote_conversation: createQuoteConversation,
  create_inquiry: createInquiry,
  display_order_payment_info: displayOrderPaymentInfo,
  display_payment_methods: displayPaymentMethods,
  upload_payment_proof_image: uploadPaymentProofImage,
  display_accepted_specs: displayAcceptedSpecs,
  display_bank_transfer_details: displayBankTransferDetails,
  display_qr_code_details: displayQRCodeDetails,
  process_payment_proof_upload: processPaymentProofUpload,
  fetch_denial_reason: fetchDenialReason,
  reupload_payment_proof: reuploadPaymentProof,
  cancel_order: cancelOrder,
  fetch_ticket_details: fetchTicketDetails,
  send_customer_reply: sendCustomerReply,
  resolve_ticket: resolveTicket,
  show_customer_orders: showCustomerOrders,
};

/**
 * Execute an action by name
 */
export {
  verifyOrder,
  uploadPaymentProof,
  displayQuoteDetails,
  displayOriginalRequest,
  displayProposalSpecs,
  displayQuotedPrice,
  acceptQuoteProposal,
  rejectQuoteProposal,
  createQuoteConversation,
  createInquiry,
  displayOrderPaymentInfo,
  displayPaymentMethods,
  uploadPaymentProofImage,
  displayAcceptedSpecs,
  displayBankTransferDetails,
  displayQRCodeDetails,
  processPaymentProofUpload,
  fetchDenialReason,
  reuploadPaymentProof,
  cancelOrder,
  fetchTicketDetails,
  sendCustomerReply,
  resolveTicket,
  showCustomerOrders,
};
