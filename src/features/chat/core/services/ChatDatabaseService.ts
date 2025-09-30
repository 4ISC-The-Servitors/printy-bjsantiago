/**
 * ChatDatabaseService
 * Thin wrappers around src/api/chatFlowApi.ts for DB-backed flows.
 * UI-agnostic and easily unit testable.
 */
import {
  attachSessionToFlow,
  createSession,
  fetchCurrentNode,
  fetchInitialNode,
  fetchOptions,
  fetchSessionMessages,
  insertMessage,
  updateCurrentNode,
  endSession,
  fetchEndNodeText,
} from '../../../api/chatFlowApi';

export const ChatDatabaseService = {
  createSession,
  attachSessionToFlow,
  fetchInitialNode,
  fetchCurrentNode,
  fetchOptions,
  fetchSessionMessages,
  insertMessage,
  updateCurrentNode,
  endSession,
  fetchEndNodeText,
} as const;


