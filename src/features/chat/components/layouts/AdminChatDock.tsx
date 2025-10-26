import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Minus } from 'lucide-react';
import { Button, Text } from '@shared/components';
import { MessageGroup, TypingIndicator, ChatInput } from '../core';
import { SessionFeedback } from '../feedback';
import { useChatLoadingToast } from '@features/chat/hooks/shared/useChatLoadingToast';
import type { ChatMessage, QuickReply } from '@features/chat/types';

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
}

/**
 * Admin chat dock - Side panel for desktop admin chat
 * Fixed right side, 420px width
 */
export const AdminChatDock: React.FC<AdminChatDockProps> = ({
  open,
  onToggle,
  title = 'Printy Assistant',
  messages,
  isTyping,
  quickReplies,
  onSend,
  onQuickReply,
  onEndChat,
  onAttachFiles,
  readOnly = false,
  sessionId,
  toast,
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

  // Show feedback widget when session is ended and scroll to it
  useEffect(() => {
    if (readOnly && sessionId) {
      setShowFeedback(true);
      
      // Scroll to bottom to show feedback UI after a brief delay
      if (scrollRef.current) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [readOnly, sessionId]);

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
          {title}
        </Text>
        <div className="flex items-center gap-2">
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
            onClick={onEndChat}
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
            userRole={'admin'}
            sessionId={sessionId}
          />
        ))}
        {isTyping && <TypingIndicator />}
        
        {/* Feedback Widget - Show when session ended and not yet submitted */}
        {readOnly && showFeedback && sessionId && (
          <SessionFeedback
            sessionId={sessionId}
            userRole="admin"
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
    </aside>
  );
};

export default AdminChatDock;
