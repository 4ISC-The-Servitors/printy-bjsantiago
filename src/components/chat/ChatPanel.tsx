import React, { useEffect, useMemo, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import MessageGroup from './MessageGroup';
import TypingIndicator from './TypingIndicator';
import EmptyState from './EmptyState';
import type { ChatRole, ChatMessage, QuickReply, ChatPanelProps } from './types';

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
  inputPlaceholder = "Type a message...",
  onEndChat,
  showAttach = true,
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.ts - b.ts),
    [messages]
  );

  // Group messages by sender and time proximity
  const messageGroups = useMemo(() => {
    const groups: { messages: ChatMessage[]; quickReplies?: QuickReply[] }[] = [];
    let currentGroup: ChatMessage[] = [];
    let lastRole: ChatRole | null = null;
    
    sortedMessages.forEach((msg, index) => {
      const isLastMessage = index === sortedMessages.length - 1;
      const isBot = msg.role === 'printy';
      
      if (msg.role !== lastRole || (currentGroup.length > 0 && Math.abs(msg.ts - currentGroup[currentGroup.length - 1].ts) > 300000)) {
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
          quickReplies: isBot ? quickReplies : undefined
        });
      }
      
      lastRole = msg.role;
    });
    
    return groups;
  }, [sortedMessages, quickReplies]);

  useEffect(() => {
    // Auto-scroll to bottom but leave space for input container
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
      <ChatHeader title={title} onBack={onBack} />

      {/* Enhanced Message Area */}
      <div
        ref={scrollRef}
        className="p-4 flex-1 min-h-[260px] max-h-[72vh] lg:max-h-[78vh] overflow-y-auto space-y-6 scrollbar-hide"
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

      <ChatInput 
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder={inputPlaceholder}
        showAttach={showAttach}
        onAttachFiles={onAttachFiles}
      />
    </div>
  );
};

export default ChatPanel;


