import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Minus } from 'lucide-react';
import SpecEditorReopenBubble from '@shared/components/forms/SpecEditorReopenBubble';
import { Button, Text } from '@shared/components';
import Progress from '@shared/components/ui/Progress';
import { MessageGroup, ChatInput } from '../core';
import { SessionFeedback } from '../feedback';
import { getSessionFeedback } from '@features/chat/api';
import { ChatEndService } from '@features/chat/services/ChatEndService';
import { useChatLoadingToast } from '@features/chat/hooks/shared/useChatLoadingToast';
import type { ChatMessage, QuickReply, ChatRole } from '@features/chat/types';

export interface AdminChatDockProps {
  open: boolean;
  onToggle: () => void;
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
 * Admin chat dock - Side panel for desktop admin chat
 * Fixed right side, 420px width
 */
export const AdminChatDock: React.FC<AdminChatDockProps> = ({
  open,
  onToggle,
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
  const [showContent, setShowContent] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showChatLoadingToast, clearLoadingToasts } =
    useChatLoadingToast(toast);
  const loadingToastIdRef = useRef<string | null>(null);

  // Group messages by role
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

  // Auto-scroll to bottom
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

  // Hide spec editor when chat becomes read-only (ended)
  useEffect(() => {
    if (readOnly) {
      try {
        window.dispatchEvent(new Event('spec-editor-hidden'));
      } catch {}
    }
  }, [readOnly]);

  const handleClose = async () => {
    try {
      window.dispatchEvent(new Event('spec-editor-hidden'));
    } catch {}
    // If we don't have session info, fall back to legacy behavior
    if (!sessionId) {
      onEndChat?.();
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
        // Session already ended, just toggle the dock closed
        onToggle?.();
      }
    } catch (error) {
      console.error('Error handling close:', error);
      // Fallback to legacy behavior
      onEndChat?.();
    }
  };

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || readOnly) return;
    onSend(text);
    setInput('');
  };

  if (!open || !showContent) return null;

  return (
    <aside
      className="hidden lg:flex fixed right-0 top-0 bottom-0 w-[420px] bg-white border-l border-neutral-200 flex-col z-30 animate-in slide-in-from-right duration-300"
      data-admin-chat-open="true"
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
        <Text variant="h3" size="lg" weight="semibold">
          {title === 'Printy Assistant'
            ? 'Chat with Printy'
            : 'Chat with Printy'}
        </Text>
        <div className="flex items-center gap-2 relative z-50">
          {/* Header remains clean; floating bubble component renders fixed when visible */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
            aria-label="Minimize chat"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto p-4 space-y-4 relative`}
      >
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

        {/* Inline feedback for historical conversations */}
        {readOnly && showFeedback && sessionId && isHistoricalConversation && (
          <SessionFeedback
            sessionId={sessionId}
            userRole="admin"
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

      {/* Feedback Modal - Show for current conversation ending (not historical) */}
      {readOnly && showFeedback && sessionId && !isHistoricalConversation && (
        <SessionFeedback
          sessionId={sessionId}
          userRole="admin"
          isOpen={showFeedback}
          onClose={() => {
            setShowFeedback(false);
            // After closing feedback, the X button will check if session is ended
            // and just close the dock instead of trying to end again
          }}
          onSubmitted={() => {
            setShowFeedback(false);
            // After feedback is submitted, session is already ended
            // Quick replies are hidden, so End Chat button won't be visible
          }}
          isModal={true}
        />
      )}
      {/* Floating Spec Editor reopen bubble */}
      <SpecEditorReopenBubble />
    </aside>
  );
};

export default AdminChatDock;

// Render floating reopen bubble at the root of the dock so it exists on pages where the dock is mounted
// This keeps the header uncluttered while ensuring the bubble is available globally when minimized
// Note: Since the bubble uses fixed positioning, it does not affect layout.
// eslint-disable-next-line import/no-default-export
