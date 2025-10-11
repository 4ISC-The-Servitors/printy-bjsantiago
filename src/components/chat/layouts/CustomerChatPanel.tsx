import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Button, Text } from '../../shared';
import { MessageGroup, TypingIndicator, ChatInput, EmptyState } from '../core';
import type { ChatMessage, QuickReply } from '../types';

export interface CustomerChatPanelProps {
  title?: string;
  messages: ChatMessage[];
  isTyping?: boolean;
  quickReplies?: QuickReply[];
  onSend: (text: string) => void;
  onQuickReply?: (value: string) => void;
  onEndChat?: () => void;
  onBack?: () => void;
  onAttachFiles?: (files: FileList) => void;
  readOnly?: boolean;
  hideInput?: boolean;
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
  onAttachFiles,
  readOnly = false,
  hideInput = false,
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-9 w-9 p-0"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
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
            onClick={onEndChat}
            className="h-9 w-9 p-0"
            aria-label="End chat"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
      >
        {messageGroups.length === 0 ? (
          <EmptyState
            title="Start a conversation"
            description="Send a message to get started with Printy"
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

      {readOnly && (
        <div className="bg-neutral-50 border-t border-neutral-200 p-4 text-center">
          <Text variant="p" size="sm" color="muted">
            This conversation has ended
          </Text>
        </div>
      )}
    </div>
  );
};

export default CustomerChatPanel;
