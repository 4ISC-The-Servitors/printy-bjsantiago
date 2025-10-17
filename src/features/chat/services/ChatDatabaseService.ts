/**
 * ChatDatabaseService
 * Thin wrappers around src/api/jsonbChatFlowApi.ts for v2 JSONB-based flows.
 * UI-agnostic and easily unit testable.
 */
import {
  createChatSessionV2,
  insertMessageV2,
  fetchSessionMessagesV2,
  endSessionV2,
  getFlowDefinition,
  getSessionMetadata,
  updateSessionMetadata,
  getSessionCustomerId,
} from '@features/chat/api/jsonbChatFlowApi';

export const ChatDatabaseService = {
  // v2 API functions
  createSession: createChatSessionV2,
  insertMessage: insertMessageV2,
  fetchSessionMessages: fetchSessionMessagesV2,
  endSession: endSessionV2,
  getFlowDefinition,
  getSessionMetadata,
  updateSessionMetadata,
  getSessionCustomerId,
} as const;
