/**
 * Action Registry
 * Maps action names to their handler functions
 */

import type { ActionHandler } from '@features/chat/types';
import { displayQuoteDetailsAdmin } from './displayQuoteDetailsAdmin';
import { aiSummarizeSpecs } from './aiSummarizeSpecs';
import { sendQuoteProposal } from './sendQuoteProposal';
import { openSpecEditorManual } from './openSpecEditor';
import { editSavedSpecs } from './editSavedSpecs';
import { checkExistingSpecs } from './checkExistingSpecs';
import { dynamicChooseAction } from './dynamicChooseAction';

/**
 * Registry of all available action handlers
 */
export const actionHandlers: Record<string, ActionHandler> = {
  display_quote_details_admin: displayQuoteDetailsAdmin,
  ai_summarize_specs: aiSummarizeSpecs,
  send_quote_proposal: sendQuoteProposal,
  open_spec_editor: openSpecEditorManual,
  edit_saved_specs: editSavedSpecs,
  check_existing_specs: checkExistingSpecs,
  dynamic_choose_action: dynamicChooseAction,
};

/**
 * Execute an action by name
 */
export { aiSummarizeSpecs, sendQuoteProposal, openSpecEditorManual, editSavedSpecs, checkExistingSpecs, dynamicChooseAction };
