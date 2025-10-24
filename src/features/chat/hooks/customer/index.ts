/**
 * Barrel export for customer-specific chat hooks
 */
export {
  useCustomerConversations,
  default as CustomerConversations,
} from './useCustomerConversations';
export {
  useJsonbFlowConversations,
  default as JsonbFlowConversations,
} from './useJsonbFlowConversations';
export {
  useRecentChatSessions,
  default as RecentChatSessions,
} from './useRecentChatSessions';
export type { ConversationLike } from './useRecentChatSessions';
export {
  useDashboardChatEvents,
  default as DashboardChatEvents,
} from './useDashboardChatEvents';
