import { useCallback, useRef } from 'react';
import { useToast } from '@lib/useToast';

export interface ChatLoadingToastOptions {
  userType: 'admin' | 'customer';
  conversationTitle?: string;
}

export const useChatLoadingToast = (externalToast?: [any, any]) => {
  const toast = externalToast || useToast();
  const activeToastIds = useRef<Set<string>>(new Set());

  const showChatLoadingToast = useCallback((options: ChatLoadingToastOptions) => {
    const { userType, conversationTitle } = options;

    // Clear any existing loading toasts for this user type
    activeToastIds.current.forEach(id => {
      toast[1].remove(id);
      activeToastIds.current.delete(id);
    });

    const title = userType === 'admin'
      ? 'Opening chat conversation...'
      : 'Loading chat...';

    const message = conversationTitle
      ? `Loading "${conversationTitle}" conversation`
      : 'Please wait while we load your conversation';

    const toastId = toast[1].info(title, message, {
      duration: 0, // Don't auto-dismiss - will be cleared when chat loads
    });

    activeToastIds.current.add(toastId);
    return toastId;
  }, [toast]);

  const showConversationSwitchToast = useCallback((conversationTitle: string) => {
    // Clear any existing loading toasts
    activeToastIds.current.forEach(id => {
      toast[1].remove(id);
      activeToastIds.current.delete(id);
    });

    const toastId = toast[1].info(
      'Switching conversations...',
      `Loading "${conversationTitle}" conversation`,
      {
        duration: 0, // Don't auto-dismiss
      }
    );

    activeToastIds.current.add(toastId);
    return toastId;
  }, [toast]);

  const clearLoadingToasts = useCallback(() => {
    activeToastIds.current.forEach(id => {
      toast[1].remove(id);
    });
    activeToastIds.current.clear();
  }, [toast]);

  const clearSpecificToast = useCallback((toastId: string) => {
    toast[1].remove(toastId);
    activeToastIds.current.delete(toastId);
  }, [toast]);

  return {
    showChatLoadingToast,
    showConversationSwitchToast,
    clearLoadingToasts,
    clearSpecificToast,
  };
};