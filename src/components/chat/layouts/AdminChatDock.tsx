import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Minus } from 'lucide-react';
import { Button, Text } from '../../shared';
import { MessageGroup, TypingIndicator, ChatInput, EmptyState } from '../core';
import SelectedChipsBar from '../../shared/SelectedChipsBar';
import type { ChatMessage, QuickReply } from '../types';

export interface AdminChatDockProps {
  open: boolean;
  onToggle: () => void;
  title?: string;
  messages: ChatMessage[];
  isTyping?: boolean;
  quickReplies?: QuickReply[];
  onSend: (text: string) => void;
  onQuickReply?: (value: string) => void;
  onEndChat?: () => void;
  onAttachFiles?: (files: FileList) => void;
  readOnly?: boolean;
  selected?: { id: string; label: string }[];
  onRemoveSelected?: (id: string) => void;
  onClearSelected?: () => void;
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
  selected = [],
  onRemoveSelected,
  onClearSelected,
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || readOnly) return;
    onSend(text);
    setInput('');
  };

  const shouldShowSelectedBar = !readOnly && selected.length > 1;

  if (!open) return null;

  return (
    <aside className="hidden lg:flex fixed right-0 top-0 bottom-0 w-[420px] bg-white border-l border-neutral-200 flex-col z-30">
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

      {/* Selected chips bar */}
      {shouldShowSelectedBar && (
        <SelectedChipsBar
          title="Selected Items"
          items={selected}
          onRemove={onRemoveSelected!}
          onClear={onClearSelected!}
        />
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messageGroups.length === 0 ? (
          <EmptyState
            title="Start chatting"
            description="Ask Printy anything about orders, tickets, or services"
          />
        ) : (
          messageGroups.map((group, idx) => (
            <MessageGroup
              key={idx}
              messages={group.messages}
              quickReplies={group.quickReplies}
              onQuickReply={onQuickReply}
              onEndChat={onEndChat}
            />
          ))
        )}
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
            showAttach={!!onAttachFiles}
            onAttachFiles={onAttachFiles}
            disabled={readOnly}
          />
        </div>
      )}

      {readOnly && (
        <div className="bg-neutral-50 border-t border-neutral-200 p-3 text-center">
          <Text variant="p" size="sm" color="muted">
            This conversation has ended
          </Text>
        </div>
      )}
    </aside>
  );
};

export default AdminChatDock;
