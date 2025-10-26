import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Minus } from 'lucide-react';
import { Button, Text } from '@shared/components';
import { MessageGroup, TypingIndicator, ChatInput } from '../core';
import { SessionFeedback } from '../feedback';
import { getSessionFeedback } from '@features/chat/api';
import { useChatLoadingToast } from '@features/chat/hooks/shared/useChatLoadingToast';
import type { ChatMessage, QuickReply } from '@features/chat/types';

export interface CustomerChatPanelProps {
  title?: string;
  messages: ChatMessage[];
  isTyping?: boolean;
  quickReplies?: QuickReply[];
  onSend: (text: string) => void;
  onQuickReply?: (value: string | { value: string; label: string }) => void;
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
  const [showContent, setShowContent] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showChatLoadingToast, clearLoadingToasts } =
    useChatLoadingToast(toast);
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
      isMinimized: true,
    };

    // Add to recent sessions
    addToRecentSessions(recentSession);

    // Minimize the panel
    onMinimize?.();
  };

  const addToRecentSessions = (session: any) => {
    try {
      // Store in localStorage
      const existing = JSON.parse(
        localStorage.getItem('recentChatSessions') || '[]'
      );
      const updated = [
        session,
        ...existing.filter(
          (s: any) => s.conversationId !== session.conversationId
        ),
      ].slice(0, 10);
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

  // Show feedback widget when session is ended, but only if not already submitted
  useEffect(() => {
    if (readOnly && sessionId) {
      const checkFeedback = async () => {
        const feedback = await getSessionFeedback(sessionId);
        if (feedback && !feedback.isSubmitted) {
          setShowFeedback(true);
        } else {
          setShowFeedback(false);
        }
      };
      void checkFeedback();
    } else {
      // Reset when sessionId changes or readOnly becomes false
      setShowFeedback(false);
    }
  }, [readOnly, sessionId]);

  // Show loading toast FIRST, then delay showing the actual chat
  // Track if this is the initial render with a sessionId
  const hasShownInitialToast = useRef(false);

  useEffect(() => {
    if (sessionId && !hasShownInitialToast.current) {
      // Reset content visibility
      setShowContent(false);

      // Clear any existing toasts first
      clearLoadingToasts();

      // Show loading toast immediately for customer chat
      loadingToastIdRef.current = showChatLoadingToast({
        userType: 'customer',
        conversationTitle: title,
      });

      // Mark that we've shown the initial toast
      hasShownInitialToast.current = true;

      // Delay showing the actual chat panel to let toast appear first
      const showTimer = setTimeout(() => {
        setShowContent(true);
      }, 600); // Show chat after 600ms

      // Clear toast after total delay
      const clearTimer = setTimeout(() => {
        if (loadingToastIdRef.current) {
          clearLoadingToasts();
          loadingToastIdRef.current = null;
        }
      }, 2000); // Clear toast after 2s total

      return () => {
        clearTimeout(showTimer);
        clearTimeout(clearTimer);
      };
    } else if (sessionId) {
      // Session already processed, show content immediately
      setShowContent(true);
    } else {
      // Reset when no session
      hasShownInitialToast.current = false;
    }
  }, [sessionId, title, showChatLoadingToast, clearLoadingToasts, toast]);

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

  if (!showContent) return null;

  return (
    <div
      className="h-full flex flex-col bg-white animate-in fade-in duration-300"
      data-chat-active="true"
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Text variant="h2" size="lg" weight="semibold">
            {title}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          {onMinimize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              className="h-9 w-9 p-0 text-neutral-500"
              aria-label="Minimize chat"
            >
              <Minus className="w-5 h-5 text-neutral-500" />
            </Button>
          )}
          {onEndChat && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-9 w-9 p-0"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-error" />
            </Button>
          )}
        </div>
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
        
        {/* Feedback Widget - Show when session ended and not yet submitted */}
        {readOnly && showFeedback && sessionId && (
          <SessionFeedback
            sessionId={sessionId}
            userRole="customer"
            onSubmitted={() => setShowFeedback(false)}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-200 shrink-0">
        {readOnly ? (
          <div className="bg-neutral-50 p-3 text-center">
            <span className="text-sm text-neutral-500">
              This conversation has ended but you can view messages.
            </span>
          </div>
        ) : (
          !hideInput && (
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              placeholder="Type a message..."
              showAttach={!!onAttachFiles}
              onAttachFiles={onAttachFiles}
              disabled={readOnly}
            />
          )
        )}
      </div>
    </div>
  );
};

export default CustomerChatPanel;
