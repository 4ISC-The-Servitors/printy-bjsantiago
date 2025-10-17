import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Minus } from 'lucide-react';
import { Button, Text } from '@shared/components';
import { MessageGroup, TypingIndicator, ChatInput } from '../core';
import type { ChatMessage, QuickReply } from '@features/chat/types';

export interface AdminChatOverlayProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  messages: ChatMessage[];
  isTyping?: boolean;
  quickReplies?: QuickReply[];
  onSend: (text: string) => void;
  onQuickReply?: (value: string) => void;
  onEndChat?: () => void;
  readOnly?: boolean;
}

/**
 * Admin chat overlay - Full-screen mobile chat overlay
 * Slides in from right on mobile/tablet
 */
export const AdminChatOverlay: React.FC<AdminChatOverlayProps> = ({
  open,
  onClose,
  title = 'Printy Assistant',
  messages,
  isTyping,
  quickReplies,
  onSend,
  onQuickReply,
  onEndChat,
  readOnly = false,
}) => {
  const [input, setInput] = useState('');
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const show = open && !minimized;

  // Restore from minimized when reopened
  useEffect(() => {
    if (open) setMinimized(false);
  }, [open]);

  // Group messages
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

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
      });
    }
  }, [messages, isTyping]);

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
              onClick={() => setMinimized(true)}
              className="h-8 w-8 p-0"
              aria-label="Minimize"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
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
            />
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        {/* Input */}
        {!readOnly && (
          <div className="border-t border-neutral-200 shrink-0">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              placeholder="Type a message..."
              showAttach={false}
              disabled={readOnly}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatOverlay;
