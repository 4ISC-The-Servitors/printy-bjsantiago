import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Minus } from 'lucide-react';
import { Button, Text } from '@shared/components';
import { MessageGroup, TypingIndicator, ChatInput, ReadOnlyOverlay } from '../core';
import { useChatLoadingToast } from '@features/chat/hooks/shared/useChatLoadingToast';
import type { ChatMessage, QuickReply } from '@features/chat/types';

export interface CustomerChatPanelProps {
  title?: string;
  messages: ChatMessage[];
  isTyping?: boolean;
  quickReplies?: QuickReply[];
  onSend: (text: string) => void;
  onQuickReply?: (value: string) => void;
  onEndChat?: () => void;
  onBack?: () => void; // Close the chat panel
  onMinimize?: () => void;
  onAttachFiles?: (files: FileList) => void;
  readOnly?: boolean;
  hideInput?: boolean;
  sessionId?: string;
  conversationId?: string;
  toast?: [any, any]; // Toast instance from parent
}

/**
 * Customer chat panel - Full-width chat for customer dashboard
 * Replaces dashboard content when active
 */
export const CustomerChatPanel: React.FC<CustomerChatPanelProps> = ({
  title = 'Chat',
  messages,
  isTyping,
  quickReplies,
  onSend,
  onQuickReply,
  onEndChat,
  onBack,
  onMinimize,
  onAttachFiles,
  readOnly = false,
  hideInput = false,
  sessionId,
  conversationId,
  toast,
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showChatLoadingToast, clearLoadingToasts } = useChatLoadingToast(toast);
  const loadingToastIdRef = useRef<string | null>(null);

  const handleClose = async () => {
    if (readOnly) {
      // Chat already ended, just close the panel
      onBack?.();
    } else {
      // Active chat - end it first, then close panel
      if (onEndChat) {
        await onEndChat();
      }
      // Close the panel immediately after ending
      onBack?.();
    }
  };

  const handleMinimize = () => {
    if (!sessionId) {
      onMinimize?.();
      return;
    }

    // Save current conversation to recent sessions
    const recentSession = {
      conversationId: conversationId || '',
      sessionId: sessionId,
      title: title,
      lastMessage: messages[messages.length - 1]?.text || '',
      timestamp: new Date().toISOString(),
      isMinimized: true
    };

    // Add to recent sessions
    addToRecentSessions(recentSession);

    // Minimize the panel
    onMinimize?.();
  };

  const addToRecentSessions = (session: any) => {
    try {
      // Store in localStorage
      const existing = JSON.parse(localStorage.getItem('recentChatSessions') || '[]');
      const updated = [session, ...existing.filter(s => s.conversationId !== session.conversationId)].slice(0, 10);
      localStorage.setItem('recentChatSessions', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent session:', error);
    }
  };

  // Group messages by role
  const messageGroups = useMemo(() => {
    const groups: { messages: ChatMessage[]; quickReplies?: QuickReply[] }[] =
      [];
    let currentGroup: ChatMessage[] = [];
    let lastRole: 'user' | 'printy' | null = null;

    const sorted = [...messages].sort((a, b) => a.ts - b.ts);

    sorted.forEach((msg, index) => {
      const isLastMessage = index === sorted.length - 1;
      const isBot = msg.role === 'printy';

      if (msg.role !== lastRole) {
        if (currentGroup.length > 0) {
          groups.push({ messages: [...currentGroup] });
        }
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }

      if (isLastMessage) {
        groups.push({
          messages: [...currentGroup],
          quickReplies: isBot ? quickReplies : undefined,
        });
      }

      lastRole = msg.role;
    });

    return groups;
  }, [messages, quickReplies]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
      });
    }
  }, [messages, isTyping]);

  // Show loading toast when chat panel mounts (first load)
  // Use a ref to track if we've already shown a toast for this sessionId
  const lastSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (sessionId && lastSessionIdRef.current !== sessionId) {
      // Clear any existing toasts first
      clearLoadingToasts();

      // Show loading toast for customer chat
      loadingToastIdRef.current = showChatLoadingToast({
        userType: 'customer',
        conversationTitle: title,
      });

      // Update the last session ID to prevent duplicate toasts
      lastSessionIdRef.current = sessionId;

      // Clear toast after a delay to simulate loading completion
      const timer = setTimeout(() => {
        if (loadingToastIdRef.current) {
          clearLoadingToasts();
          loadingToastIdRef.current = null;
        }
      }, 1500); // 1.5 second loading indicator

      return () => {
        clearTimeout(timer);
      };
    }
  }, [sessionId, title]); // Remove showChatLoadingToast and clearLoadingToasts from deps

  // Clear toasts when component unmounts
  useEffect(() => {
    return () => {
      clearLoadingToasts();
      loadingToastIdRef.current = null;
    };
  }, [clearLoadingToasts]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || readOnly) return;
    onSend(text);
    setInput('');
  };

  return (
    <div className="h-full flex flex-col bg-white" data-chat-active="true">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onMinimize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              className="h-9 w-9 p-0"
              aria-label="Minimize chat"
            >
              <Minus className="w-5 h-5" />
            </Button>
          )}
          <Text variant="h2" size="xl" weight="semibold">
            {title}
          </Text>
        </div>
        {onEndChat && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-9 w-9 p-0"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative"
      >
        {messageGroups.map((group, idx) => (
          <MessageGroup
            key={idx}
            messages={group.messages}
            quickReplies={group.quickReplies}
            onQuickReply={onQuickReply}
            onEndChat={onEndChat}
            readOnly={readOnly}
            isHistorical={group.messages[0]?.isHistorical}
            userRole={'customer'}
            sessionId={sessionId}
            conversationId={conversationId}
          />
        ))}
        {isTyping && <TypingIndicator />}

        {/* ReadOnlyOverlay - sticky positioned to bottom of scroll container */}
        {readOnly && (
          <ReadOnlyOverlay />
        )}
      </div>

      {/* Input */}
      {!hideInput && !readOnly && (
        <div className="border-t border-neutral-200 shrink-0">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Type a message..."
            showAttach={!!onAttachFiles}
            onAttachFiles={onAttachFiles}
            disabled={readOnly}
          />
        </div>
      )}
    </div>
  );
};

export default CustomerChatPanel;
