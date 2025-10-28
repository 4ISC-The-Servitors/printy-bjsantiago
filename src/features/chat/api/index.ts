/**
 * Barrel export for chat APIs
 * Only v2 JSONB-based functions are exported.
 */
export {
  getFlowDefinition,
  fetchSessionMessagesV2,
  getUserSessionsV2,
  endSessionV2,
  createChatSessionV2,
  insertMessageV2,
  getSessionMetadata,
  updateSessionMetadata,
  getSessionCustomerId,
} from './jsonbChatFlowApi';

/**
 * Feedback API exports
 */
export { submitSessionFeedback, getSessionFeedback } from './feedbackApi';

/**
 * LLM Client exports
 */
export type { LLMMessage } from './llmClient';
export { generateJSON, generateWithCohere } from './llmClient';

/**
 * Services API exports
 */
export {
  fetchAllServices,
  fetchActiveServices,
  fetchServicesByCategory,
  fetchActiveServicesByCategory,
  fetchServicesWithFilters,
  fetchCategories,
  subscribeToServices,
  subscribeToActiveServices,
  fetchServiceByDisplayId,
  searchServices,
} from './servicesApi';