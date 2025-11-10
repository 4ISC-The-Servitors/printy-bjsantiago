/**
 * CustomerConversationsProvider
 * Context provider to share customer conversation state across components
 * Prevents duplicate hook instances and message duplication
 */
import React, { createContext, useContext, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useCustomerConversations } from './useCustomerConversations';
import type { ChatMessage, QuickReply } from '@features/chat/types';
import { useSessionCache } from '@customer/components/shared/cache/SessionCacheProvider';

interface ConversationItem {
  id: string;
  title: string;
  createdAt: number;
  updatedAt?: number;
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
  handleQuickReply: (
    data: string | { value: string; label: string }
  ) => Promise<void>;
  switchConversation: (id: string) => Promise<void>;
  endChat: (conversationId?: string, targetSessionId?: string) => Promise<void>;
  setActiveId: (id: string | null) => void;
  setConversations: React.Dispatch<React.SetStateAction<ConversationItem[]>>;
}

const CustomerConversationsContext =
  createContext<CustomerConversationsContextValue | null>(null);

const noopAsync = async () => {
  // no-op
};
const noopSetActiveId: (id: string | null) => void = () => {
  // no-op
};
const noopSetConversations: React.Dispatch<
  React.SetStateAction<ConversationItem[]>
> = () => {
  // no-op
};

const defaultContextValue: CustomerConversationsContextValue = {
  messages: [],
  isTyping: false,
  conversations: [],
  activeId: null,
  quickReplies: [],
  inputPlaceholder: '',
  sessionId: null,
  initializeFlow: noopAsync,
  handleSend: noopAsync,
  handleQuickReply: noopAsync,
  switchConversation: noopAsync,
  endChat: noopAsync,
  setActiveId: noopSetActiveId,
  setConversations: noopSetConversations,
};

let hasLoggedMissingProvider = false;

export function CustomerConversationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const conversationState = useCustomerConversations();
  const { sessions } = useSessionCache();

  // Sync conversations from SessionCache when sessions change
  useEffect(() => {
    // Map SessionCache format to ConversationItem format
    const mappedConversations: ConversationItem[] = (sessions || []).map(
      session => ({
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messages: session.messages || [],
        flowId: session.flowId || 'about',
        status: session.status,
        icon: session.icon,
        context: session.context,
      })
    );

    // Update conversations state to sync with cache
    conversationState.setConversations(prev => {
      // Create a map of existing conversations by ID for quick lookup
      const existingMap = new Map(prev.map(c => [c.id, c]));

      // Update or add conversations from cache
      const updatedConversations = mappedConversations.map(cachedConv => {
        const existing = existingMap.get(cachedConv.id);
        // If conversation exists and is currently active, preserve its messages
        // Otherwise, use the cached version (which may have updated status)
        if (
          existing &&
          existing.id === conversationState.activeId &&
          existing.messages.length > 0
        ) {
          // Preserve messages for active conversation, but update other fields
          return {
            ...cachedConv,
            messages: existing.messages,
          };
        }
        return cachedConv;
      });

      // Keep any conversations that were added during runtime but aren't in cache yet
      // (e.g., newly created conversations that haven't been saved to cache)
      const cacheIds = new Set(mappedConversations.map(c => c.id));
      const runtimeConversations = prev.filter(c => !cacheIds.has(c.id));

      // Return updated conversations from cache + runtime conversations
      return [...updatedConversations, ...runtimeConversations];
    });
  }, [
    sessions,
    conversationState.setConversations,
    conversationState.activeId,
  ]); // Re-run when sessions from cache change

  // ✅ Memoize the context value to prevent unnecessary re-renders
  // This ensures child components don't re-render when parent re-renders
  const contextValue = useMemo(
    () => conversationState,
    [
      conversationState.messages,
      conversationState.isTyping,
      conversationState.conversations,
      conversationState.activeId,
      conversationState.quickReplies,
      conversationState.inputPlaceholder,
      conversationState.sessionId,
      // Functions are stable from useCallback, no need to include them
    ]
  );

  return (
    <CustomerConversationsContext.Provider value={contextValue}>
      {children}
    </CustomerConversationsContext.Provider>
  );
}

export function useCustomerConversationsContext() {
  const context = useContext(CustomerConversationsContext);
  if (!context) {
    if (import.meta.env.DEV && !hasLoggedMissingProvider) {
      console.warn(
        'useCustomerConversationsContext called outside of provider. Returning default no-op context. This typically happens during HMR — ensure the provider wraps your component tree.'
      );
      hasLoggedMissingProvider = true;
    }
    return defaultContextValue;
  }
  return context;
}

export default CustomerConversationsProvider;
