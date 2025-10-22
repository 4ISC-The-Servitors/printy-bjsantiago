import React, { useEffect, useRef, useMemo } from 'react';
import { MessageGroup, TypingIndicator } from '@features/chat/components/core';
import type { ChatMessage, QuickReply } from '@features/chat/types/chat';

interface GuestChatPanelProps {
  title?: string;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isTyping?: boolean;
  onAttachFiles?: (files: FileList) => void;
  onBack?: () => void;
  quickReplies?: QuickReply[];
  onQuickReply?: (value: string) => void;
  inputPlaceholder?: string;
  onEndChat?: () => void;
  showAttach?: boolean;
}

/**
 * Guest chat panel - Embedded chat for landing page
 * Uses shared chat core components
 */
export const GuestChatPanel: React.FC<GuestChatPanelProps> = ({
  messages,
  isTyping = false,
  quickReplies,
  onQuickReply,
  onEndChat,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group messages by role
  const messageGroups = useMemo(() => {
    const groups: { messages: ChatMessage[]; quickReplies?: QuickReply[] }[] = [];
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

  return (
    <div className="w-full relative h-96 max-h-96 flex flex-col bg-white border border-neutral-200 rounded-lg">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messageGroups.map((group, idx) => (
          <MessageGroup
            key={idx}
            messages={group.messages}
            quickReplies={group.quickReplies}
            onQuickReply={onQuickReply}
            onEndChat={onEndChat}
          />
        ))}
        {isTyping && <TypingIndicator />}
      </div>
    </div>
  );
};

export default GuestChatPanel;
