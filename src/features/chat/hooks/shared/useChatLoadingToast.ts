import { useCallback, useRef } from 'react';
import { useToast } from '@lib/useToast';

export interface ChatLoadingToastOptions {
  userType: 'admin' | 'customer';
  conversationTitle?: string;
}

export const useChatLoadingToast = (externalToast?: [any, any]) => {
  const toast = externalToast || useToast();
  const activeToastIds = useRef<Set<string>>(new Set());
  // Store the toast methods in a ref to prevent recreation on every render
  const toastMethodsRef = useRef(toast[1]);
  toastMethodsRef.current = toast[1];

  const showChatLoadingToast = useCallback(
    (options: ChatLoadingToastOptions) => {
      const { userType, conversationTitle } = options;

      // Clear any existing loading toasts for this user type
      activeToastIds.current.forEach(id => {
        toastMethodsRef.current.remove(id);
        activeToastIds.current.delete(id);
      });

      const title =
        userType === 'admin'
          ? 'Opening chat conversation...'
          : 'Loading chat...';

      const message = conversationTitle
        ? `Loading "${conversationTitle}" conversation`
        : 'Please wait while we load your conversation';

      const toastId = toastMethodsRef.current.info(title, message, {
        duration: 0, // Don't auto-dismiss - will be cleared when chat loads
      });

      activeToastIds.current.add(toastId);
      return toastId;
    },
    []
  );

  const showConversationSwitchToast = useCallback(
    (conversationTitle: string) => {
      // Clear any existing loading toasts
      activeToastIds.current.forEach(id => {
        toastMethodsRef.current.remove(id);
        activeToastIds.current.delete(id);
      });

      const toastId = toastMethodsRef.current.info(
        'Switching conversations...',
        `Loading "${conversationTitle}" conversation`,
        {
          duration: 0, // Don't auto-dismiss
        }
      );

      activeToastIds.current.add(toastId);
      return toastId;
    },
    []
  );

  const clearLoadingToasts = useCallback(() => {
    activeToastIds.current.forEach(id => {
      toastMethodsRef.current.remove(id);
    });
    activeToastIds.current.clear();
  }, []);

  const clearSpecificToast = useCallback((toastId: string) => {
    toastMethodsRef.current.remove(toastId);
    activeToastIds.current.delete(toastId);
  }, []);

  return {
    showChatLoadingToast,
    showConversationSwitchToast,
    clearLoadingToasts,
    clearSpecificToast,
  };
};
