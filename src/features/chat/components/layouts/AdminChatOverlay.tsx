import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Minus } from 'lucide-react';
import { Button, Text } from '@shared/components';
import Progress from '@shared/components/ui/Progress';
import { MessageGroup, ChatInput } from '../core';
import SpecEditorReopenBubble from '@shared/components/forms/SpecEditorReopenBubble';
import { SessionFeedback } from '../feedback';
import { getSessionFeedback } from '@features/chat/api';
import { ChatEndService } from '@features/chat/services/ChatEndService';
import { useChatLoadingToast } from '@features/chat/hooks/shared/useChatLoadingToast';
import type { ChatMessage, QuickReply, ChatRole } from '@features/chat/types';

export interface AdminChatOverlayProps {
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
  toast?: [any, any]; // Toast instance from parent
  uploadProgressPct?: number | null;
}

/**
 * Admin chat overlay - Full-screen mobile chat overlay
 * Slides in from right on mobile/tablet
 */
export const AdminChatOverlay: React.FC<AdminChatOverlayProps> = ({
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
    try {
      window.dispatchEvent(new Event('spec-editor-hidden'));
    } catch {}
    // If we don't have session info, fall back to legacy behavior
    if (!sessionId) {
      onClose?.();
      return;
    }

    try {
      // Check if session is already ended
      const isEnded = await ChatEndService.isSessionEnded(sessionId);

      if (!isEnded) {
        // Session is active, end it using the unified service
        // This will be handled by the parent component through the updated endChat function
        onEndChat?.();
      } else {
        // Session already ended, just close the overlay
        onClose?.();
      }
    } catch (error) {
      console.error('Error handling close:', error);
      // Fallback to legacy behavior
      onClose?.();
    }
  };

  const handleMinimize = () => {
    if (!sessionId) {
      setMinimized(true);
      return;
    }

    // Save current conversation to recent sessions
    const recentSession = {
      conversationId: conversationId || '',
      sessionId: sessionId,
      customerName: title,
      lastMessage: messages[messages.length - 1]?.text || '',
      timestamp: new Date().toISOString(),
      isMinimized: true,
    };

    // Add to recent sessions
    addToRecentSessions(recentSession);

    // Minimize the overlay
    setMinimized(true);
  };

  const addToRecentSessions = (session: any) => {
    try {
      // Store in localStorage or context
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

  const show = open && !minimized && showContent;

  // Restore from minimized when reopened
  useEffect(() => {
    if (open) setMinimized(false);
  }, [open]);

  // Show loading toast FIRST, then delay showing the actual chat
  useEffect(() => {
    if (open && sessionId) {
      // Reset content visibility
      setShowContent(false);

      // Show loading toast immediately
      loadingToastIdRef.current = showChatLoadingToast({
        userType: 'admin',
        conversationTitle: title,
      });

      // Delay showing the actual chat overlay to let toast appear first
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
    }
  }, [open, sessionId, title, showChatLoadingToast, clearLoadingToasts]);

  // Clear toasts and content when component closes
  useEffect(() => {
    if (!open) {
      clearLoadingToasts();
      loadingToastIdRef.current = null;
      setShowContent(false);
    }
  }, [open, clearLoadingToasts]);

  // Hide spec editor when chat becomes read-only (ended)
  useEffect(() => {
    if (readOnly) {
      try {
        window.dispatchEvent(new Event('spec-editor-hidden'));
      } catch {}
    }
  }, [readOnly]);

  // Group messages
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

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
      });
    }
  }, [messages, isTyping]);

  // Check if this is a historical conversation (all messages are historical)
  const isHistoricalConversation = useMemo(() => {
    if (messages.length === 0) return false;
    return messages.every(msg => msg.isHistorical === true);
  }, [messages]);

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
      data-admin-chat-open="true"
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
              userRole={'admin'}
              sessionId={sessionId}
              conversationId={conversationId}
            />
          ))}
          {/* Global typing indicator removed to avoid duplication; MessageGroup handles typing */}

          {/* Inline feedback removed for historical conversations - users should not see feedback when backreading */}
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
          userRole="admin"
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

      {/* Floating Spec Editor reopen bubble for mobile/tablet overlay */}
      <SpecEditorReopenBubble />

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

export default AdminChatOverlay;
