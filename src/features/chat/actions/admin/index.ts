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
import { displayCategoriesForAdmin } from './displayCategoriesForAdmin';
import { validateAndCreateCategory } from './validateAndCreateCategory';
import { validateAndCreateService } from './validateAndCreateService';
import { displayServiceForAdmin } from './displayServiceForAdmin';
import { validateAndUpdateService } from './validateAndUpdateService';
import { validateAndUpdateCategory } from './validateAndUpdateCategory';
import { validateAndChangeServiceCategory } from './validateAndChangeServiceCategory';
import { displayCategoriesForChangeCategory } from './displayCategoriesForChangeCategory';
import { displayAboutSectionsAdmin } from './displayAboutSectionsAdmin';
import { createAboutSectionAdmin } from './createAboutSectionAdmin';
import { updateAboutSectionAdmin } from './updateAboutSectionAdmin';
import { deleteAboutSectionAdmin } from './deleteAboutSectionAdmin';
import { displayFaqsAdmin } from './displayFaqsAdmin';
import { createFaqAdmin } from './createFaqAdmin';
import { updateFaqAdmin } from './updateFaqAdmin';
import { deleteFaqAdmin } from './deleteFaqAdmin';

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
  display_categories_for_admin: displayCategoriesForAdmin,
  validate_and_create_category: validateAndCreateCategory,
  validate_and_create_service: validateAndCreateService,
  display_service_for_admin: displayServiceForAdmin,
  validate_and_update_service: validateAndUpdateService,
  validate_and_update_category: validateAndUpdateCategory,
  validate_and_change_service_category: validateAndChangeServiceCategory,
  display_categories_for_change_category: displayCategoriesForChangeCategory,
  display_about_sections_admin: displayAboutSectionsAdmin,
  create_about_section_admin: createAboutSectionAdmin,
  update_about_section_admin: updateAboutSectionAdmin,
  delete_about_section_admin: deleteAboutSectionAdmin,
  display_faqs_admin: displayFaqsAdmin,
  create_faq_admin: createFaqAdmin,
  update_faq_admin: updateFaqAdmin,
  delete_faq_admin: deleteFaqAdmin,
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
  displayCategoriesForAdmin,
  validateAndCreateCategory,
  validateAndCreateService,
  displayServiceForAdmin,
  validateAndUpdateService,
  validateAndUpdateCategory,
  validateAndChangeServiceCategory,
  displayCategoriesForChangeCategory,
  displayAboutSectionsAdmin,
  createAboutSectionAdmin,
  updateAboutSectionAdmin,
  deleteAboutSectionAdmin,
  displayFaqsAdmin,
  createFaqAdmin,
  updateFaqAdmin,
  deleteFaqAdmin,
};
