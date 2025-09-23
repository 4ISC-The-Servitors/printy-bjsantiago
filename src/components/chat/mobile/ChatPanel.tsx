import React, { useEffect, useMemo, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import MessageGroup from '../_shared/MessageGroup';
import TypingIndicator from '../_shared/TypingIndicator';
import EmptyState from '../_shared/EmptyState';
import type {
  ChatRole,
  ChatMessage,
  QuickReply,
  ChatPanelProps,
} from '../_shared/types';

// Re-export types for backwards compatibility
export type { ChatRole, ChatMessage, QuickReply, ChatPanelProps };

export const ChatPanel: React.FC<ChatPanelProps> = ({
  title = 'Chat',
  messages,
  onSend,
  isTyping = false,
  onAttachFiles,
  onBack,
  quickReplies,
  onQuickReply,
  inputPlaceholder = 'Type a message...',
  onEndChat,
  showAttach = true,
  // Mobile-specific props
  mobileOffsetLeftClass = 'left-16',
  hideHeader = false,
  hideInput = false,
  readOnly = false,
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.ts - b.ts),
    [messages]
  );

  // Group messages by sender and time proximity
  const messageGroups = useMemo(() => {
    const groups: { messages: ChatMessage[]; quickReplies?: QuickReply[] }[] =
      [];
    let currentGroup: ChatMessage[] = [];
    let lastRole: ChatRole | null = null;

    sortedMessages.forEach((msg, index) => {
      const isLastMessage = index === sortedMessages.length - 1;
      const isBot = msg.role === 'printy';

      if (
        msg.role !== lastRole ||
        (currentGroup.length > 0 &&
          Math.abs(msg.ts - currentGroup[currentGroup.length - 1].ts) > 300000)
      ) {
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
  }, [sortedMessages, quickReplies]);

  useEffect(() => {
    // Auto-scroll to bottom with mobile keyboard consideration
    const el = scrollRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages, isTyping]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
  };

  const handleQuickReply = (value: string) => {
    onQuickReply?.(value);
  };

  return (
    <div className="bg-white flex flex-col h-full w-full">
      {!hideHeader && <ChatHeader title={title} onBack={onBack} />}

      {/* Mobile Message Area with extra bottom padding for fixed input */}
      <div
        ref={scrollRef}
        className="p-4 flex-1 min-h-0 overflow-y-auto space-y-4 scrollbar-hide pb-32"
      >
        {messageGroups.map((group, index) => (
          <MessageGroup
            key={index}
            messages={group.messages}
            quickReplies={group.quickReplies}
            onQuickReply={handleQuickReply}
            onEndChat={onEndChat}
          />
        ))}

        {isTyping && (
          <div className="text-left">
            <TypingIndicator />
          </div>
        )}

        {/* Empty state for new chats */}
        {messageGroups.length === 0 && !isTyping && <EmptyState />}
      </div>

      {/* Mobile Fixed Input Area */}
      {!hideInput && (
        <div
          className={`fixed bottom-0 ${mobileOffsetLeftClass} right-0 bg-white border-t border-neutral-200 z-40`}
        >
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder={inputPlaceholder}
            showAttach={showAttach}
            onAttachFiles={onAttachFiles}
          />
        </div>
      )}

      {/* Read-only bottom spacer to avoid overlap with any external banners */}
      {readOnly && <div className="h-12" />}
    </div>
  );
};

export default ChatPanel;
