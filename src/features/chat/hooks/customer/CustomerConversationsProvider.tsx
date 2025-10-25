/**
 * CustomerConversationsProvider
 * Context provider to share customer conversation state across components
 * Prevents duplicate hook instances and message duplication
 */
import React, { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useCustomerConversations } from './useCustomerConversations';
import type { ChatMessage, QuickReply } from '@features/chat/types';

interface ConversationItem {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  flowId: string;
  status: 'active' | 'ended';
  icon?: React.ReactNode;
  context?: any;
}

interface CustomerConversationsContextValue {
  messages: ChatMessage[];
  isTyping: boolean;
  conversations: ConversationItem[];
  activeId: string | null;
  quickReplies: QuickReply[];
  inputPlaceholder: string;
  sessionId: string | null;
  initializeFlow: (flowId: string, title: string, ctx?: any) => Promise<void>;
  handleSend: (text: string) => Promise<void>;
  handleQuickReply: (data: string | { value: string; label: string }) => Promise<void>;
  switchConversation: (id: string) => Promise<void>;
  endChat: (conversationId?: string, targetSessionId?: string) => Promise<void>;
  setActiveId: (id: string | null) => void;
  setConversations: React.Dispatch<React.SetStateAction<ConversationItem[]>>;
}

const CustomerConversationsContext = createContext<CustomerConversationsContextValue | null>(null);

export function CustomerConversationsProvider({ children }: { children: ReactNode }) {
  const conversationState = useCustomerConversations();

  // ✅ Memoize the context value to prevent unnecessary re-renders
  // This ensures child components don't re-render when parent re-renders
  const contextValue = useMemo(() => conversationState, [
    conversationState.messages,
    conversationState.isTyping,
    conversationState.conversations,
    conversationState.activeId,
    conversationState.quickReplies,
    conversationState.inputPlaceholder,
    conversationState.sessionId,
    // Functions are stable from useCallback, no need to include them
  ]);

  return (
    <CustomerConversationsContext.Provider value={contextValue}>
      {children}
    </CustomerConversationsContext.Provider>
  );
}

export function useCustomerConversationsContext() {
  const context = useContext(CustomerConversationsContext);
  if (!context) {
    throw new Error(
      'useCustomerConversationsContext must be used within CustomerConversationsProvider'
    );
  }
  return context;
}

export default CustomerConversationsProvider;
