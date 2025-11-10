import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Minus } from 'lucide-react';
import { Button, Text } from '@shared/components';
import Progress from '@shared/components/ui/Progress';
import { MessageGroup, ChatInput } from '../core';
import { SessionFeedback } from '../feedback';
import { getSessionFeedback } from '@features/chat/api';
import { ChatEndService } from '@features/chat/services/ChatEndService';
import { useChatLoadingToast } from '@features/chat/hooks/shared/useChatLoadingToast';
import type { ChatMessage, QuickReply, ChatRole } from '@features/chat/types';

export interface CustomerChatOverlayProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  messages: ChatMessage[];
  isTyping?: boolean;
  quickReplies?: QuickReply[];
  onSend: (text: string) => void;
  onQuickReply?: (value: string | { value: string; label: string }) => void;
  onEndChat?: () => void;
  onAttachFiles?: (files: FileList) => void;
  readOnly?: boolean;
  sessionId?: string;
  conversationId?: string;
  toast?: [any, any];
  uploadProgressPct?: number | null;
}

/**
 * Customer chat overlay - Full-screen mobile/tablet chat overlay
 * Slides in from right on mobile/tablet, mirrors AdminChatOverlay but uses 'customer' role
 */
export const CustomerChatOverlay: React.FC<CustomerChatOverlayProps> = ({
  open,
  onClose,
  title = 'Chat with Printy',
  messages,
  isTyping,
  quickReplies,
  onSend,
  onQuickReply,
  onEndChat,
  onAttachFiles,
  readOnly = false,
  sessionId,
  conversationId,
  toast,
  uploadProgressPct,
}) => {
  const [input, setInput] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showChatLoadingToast, clearLoadingToasts } =
    useChatLoadingToast(toast);
  const loadingToastIdRef = useRef<string | null>(null);

  const handleClose = async () => {
    if (!sessionId) {
      onClose?.();
      return;
    }

    try {
      const isEnded = await ChatEndService.isSessionEnded(sessionId);

      if (!isEnded) {
        onEndChat?.();
      } else {
        onClose?.();
      }
    } catch (error) {
      console.error('Error handling close:', error);
      onClose?.();
    }
  };

  const handleMinimize = () => {
    if (!sessionId) {
      setMinimized(true);
      return;
    }

    const recentSession = {
      conversationId: conversationId || '',
      sessionId: sessionId,
      customerName: title,
      lastMessage: messages[messages.length - 1]?.text || '',
      timestamp: new Date().toISOString(),
      isMinimized: true,
    };

    try {
      const existing = JSON.parse(
        localStorage.getItem('recentChatSessions') || '[]'
      );
      const updated = [
        recentSession,
        ...existing.filter(
          (s: any) => s.conversationId !== recentSession.conversationId
        ),
      ].slice(0, 10);
      localStorage.setItem('recentChatSessions', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent session:', error);
    }

    setMinimized(true);
  };

  const show = open && !minimized && showContent;

  useEffect(() => {
    if (open) setMinimized(false);
  }, [open]);

  useEffect(() => {
    if (open && sessionId) {
      setShowContent(false);

      loadingToastIdRef.current = showChatLoadingToast({
        userType: 'customer',
        conversationTitle: title,
      });

      const showTimer = setTimeout(() => {
        setShowContent(true);
      }, 600);

      const clearTimer = setTimeout(() => {
        if (loadingToastIdRef.current) {
          clearLoadingToasts();
          loadingToastIdRef.current = null;
        }
      }, 2000);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [open, sessionId, title, showChatLoadingToast, clearLoadingToasts]);

  useEffect(() => {
    if (!open) {
      clearLoadingToasts();
      loadingToastIdRef.current = null;
      setShowContent(false);
    }
  }, [open, clearLoadingToasts]);

  const messageGroups = useMemo(() => {
    const groups: { messages: ChatMessage[]; quickReplies?: QuickReply[] }[] =
      [];
    let currentGroup: ChatMessage[] = [];
    let lastRole: ChatRole | null = null;

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

  // Check if this is a historical conversation (all messages are historical)
  const isHistoricalConversation = useMemo(() => {
    if (messages.length === 0) return false;
    return messages.every(msg => msg.isHistorical === true);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
      });
    }
  }, [messages, isTyping]);

  // Show feedback modal only for current conversation ending (not historical)
  // Historical conversations should not show feedback modal
  useEffect(() => {
    if (readOnly && sessionId && !isHistoricalConversation) {
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
      // Reset when sessionId changes, readOnly becomes false, or it's historical
      setShowFeedback(false);
    }
  }, [readOnly, sessionId, isHistoricalConversation]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || readOnly) return;
    onSend(text);
    setInput('');
  };

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-40 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-200`}
      data-customer-chat-open="true"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute top-0 right-0 h-full w-full md:w-[520px] bg-white shadow-xl md:rounded-l-2xl flex flex-col transform transition-transform duration-300 ${show ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 shrink-0">
          <Text variant="h3" size="base" weight="semibold">
            {title}
          </Text>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              className="h-8 w-8 p-0"
              aria-label="Minimize"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messageGroups.map((group, idx) => (
            <MessageGroup
              key={idx}
              messages={group.messages}
              quickReplies={group.quickReplies}
              onQuickReply={onQuickReply}
              onEndChat={onEndChat}
              readOnly={readOnly}
              isHistorical={group.messages.every(m => m.isHistorical === true)}
              userRole={'customer'}
              sessionId={sessionId}
              conversationId={conversationId}
            />
          ))}
          {/* Global typing indicator removed to avoid duplication; MessageGroup handles typing */}
          {/* Inline feedback for historical conversations */}
          {readOnly &&
            showFeedback &&
            sessionId &&
            isHistoricalConversation && (
              <SessionFeedback
                sessionId={sessionId}
                userRole="customer"
                isModal={false}
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
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              placeholder="Type a message..."
              showAttach={!!onAttachFiles}
              onAttachFiles={onAttachFiles}
              disabled={readOnly}
            />
          )}
        </div>
      </div>

      {/* Feedback Modal - Show for current conversation ending (not historical) */}
      {readOnly && showFeedback && sessionId && !isHistoricalConversation && (
        <SessionFeedback
          sessionId={sessionId}
          userRole="customer"
          isOpen={showFeedback}
          onClose={() => {
            setShowFeedback(false);
            // After closing feedback, the X button will check if session is ended
            // and just close the overlay instead of trying to end again
          }}
          onSubmitted={() => {
            setShowFeedback(false);
            // After feedback is submitted, session is already ended
            // Quick replies are hidden, so End Chat button won't be visible
          }}
          isModal={true}
        />
      )}

      {typeof uploadProgressPct === 'number' && (
        <div className="absolute bottom-3 left-4 right-4 bg-white/90 backdrop-blur-sm border border-neutral-200 rounded-xl px-4 py-2 shadow-lg">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-neutral-500">Uploading images…</span>
            <span className="text-xs text-neutral-500">
              {uploadProgressPct}%
            </span>
          </div>
          <Progress value={uploadProgressPct} />
        </div>
      )}
    </div>
  );
};

export default CustomerChatOverlay;
