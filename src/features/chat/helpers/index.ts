/**
 * Helper functions index
 * Exports all helper functions for flow processing
 */

export {
  buildQuickReplies,
  insertMessage,
  updateSessionMetadata,
  endSession,
  processPendingQuoteAction,
  fetchSessionMessages,
} from './flowHelpers';

/**
 * Quote assistant and spec editor exports
 */
export {
  QUOTE_ASSISTANT_SYSTEM_PROMPT,
  buildConversationPrompt,
  type SpecData,
  type QuoteAnalysisResult,
} from './quoteAssistantPrompt';

export { SPEC_EDITOR_OPEN, openSpecEditor } from './specEditorEvents';
