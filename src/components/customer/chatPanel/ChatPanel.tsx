import React, { useEffect, useMemo, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import MessageGroup from '../../chat/_shared/MessageGroup';
import TypingIndicator from '../../chat/_shared/TypingIndicator';
import EmptyState from '../../chat/_shared/EmptyState';
import type {
  ChatRole,
  ChatMessage,
  QuickReply,
  ChatPanelProps,
} from '../../chat/_shared/types';

export type { ChatRole, ChatMessage, QuickReply, ChatPanelProps };

const ChatPanel: React.FC<ChatPanelProps> = ({
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
  hideHeader = false,
  hideSelectedBar = false, // not used in customer panel
  hideInput = false,
  readOnly = false,
  onMinimize,
  onClose,
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.ts - b.ts),
    [messages]
  );

  const messageGroups = useMemo(() => {
    const groups: { messages: ChatMessage[]; quickReplies?: QuickReply[] }[] = [];
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
        if (currentGroup.length > 0) groups.push({ messages: [...currentGroup] });
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
      if (isLastMessage) {
        groups.push({ messages: [...currentGroup], quickReplies: isBot ? quickReplies : undefined });
      }
      lastRole = msg.role;
    });
    return groups;
  }, [sortedMessages, quickReplies]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
  }, [messages, isTyping]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
  };

  const handleQuickReply = (value: string) => onQuickReply?.(value);

  return (
    <div className="bg-white flex flex-col h-full w-full relative">
      {!hideHeader && (
        <ChatHeader
          title={title}
          onBack={onBack}
          onMinimize={onMinimize}
          onClose={onClose || onEndChat}
        />
      )}

      <div ref={scrollRef} className="p-6 flex-1 min-h-0 overflow-y-auto space-y-6 scrollbar-hide">
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

        {messageGroups.length === 0 && !isTyping && <EmptyState />}
      </div>

      {readOnly && <div className="h-12" />}

      {!hideInput && (
        <div className="border-t border-neutral-200 bg-white">
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

      {readOnly && (
        <div className="absolute bottom-0 left-0 right-0 bg-neutral-50 border-t border-neutral-200 p-3 text-center z-10">
          <span className="text-sm text-neutral-500">This conversation has ended but you can view messages.</span>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;


