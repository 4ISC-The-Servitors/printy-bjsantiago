import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, Button } from '../shared';
import { Bot, Send, Paperclip, ArrowLeft, User } from 'lucide-react';

export type ChatRole = 'user' | 'printy';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  ts: number;
}

export interface QuickReply {
  label: string;
  value: string;
}

export interface ChatPanelProps {
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
}

function formatRelativeTime(ts: number): string {
  const now = Date.now();
  const diffMs = Math.max(0, now - ts);
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin <= 0) return 'Just now';
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} mins ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr === 1) return '1 hr ago';
  if (diffHr < 24) return `${diffHr} hrs ago`;
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const TypingIndicator: React.FC<{ delay?: number }> = ({ delay = 2000 }) => (
  <div 
    className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-brand-primary-50 text-neutral-700 text-sm align-middle"
    style={{ animationDelay: `${delay}ms` }}
  >
    <span className="relative inline-flex w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:-200ms]" />
    <span className="relative inline-flex w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:-100ms]" />
    <span className="relative inline-flex w-2 h-2 rounded-full bg-neutral-400 animate-bounce" />
  </div>
);

const MessageGroup: React.FC<{
  messages: ChatMessage[];
  quickReplies?: QuickReply[];
  onQuickReply?: (value: string) => void;
}> = ({ messages, quickReplies, onQuickReply }) => {
  const isBot = messages[0]?.role === 'printy';
  const lastTs = messages[messages.length - 1]?.ts ?? Date.now();
  
  return (
    <div className={`space-y-2 ${isBot ? 'text-left' : 'text-right'}`}>
      {messages.map((m) => (
        <div key={m.id} className={isBot ? 'text-left' : 'text-right'}>
          <div className="flex items-start gap-2">
            {isBot && (
              <div className="w-6 h-6 rounded-md bg-brand-primary text-white flex items-center justify-center text-xs mt-1">
                <Bot className="w-3 h-3" />
              </div>
            )}
            <div
              className={
                'inline-block rounded-2xl px-4 py-3 text-sm break-words max-w-[85%] leading-relaxed ' +
                (isBot
                  ? 'bg-brand-primary-50 text-neutral-700'
                  : 'bg-brand-primary text-white ml-auto')
              }
            >
              {isBot && messages.length > 1 && messages.indexOf(m) === 0 && (
                <div className="text-xs text-neutral-500 mb-1">Assistant</div>
              )}
              {m.text}
            </div>
            {!isBot && (
              <div className="w-6 h-6 rounded-md bg-neutral-600 text-white flex items-center justify-center text-xs mt-1">
                <User className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Relative timestamp */}
      <div className={`text-xs text-neutral-500 ${isBot ? 'pl-8 text-left' : 'pr-0 text-right'}`}>
        {formatRelativeTime(lastTs)}
      </div>
      
      {/* Quick Replies under bot messages */}
      {isBot && quickReplies && quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 ml-8">
          {quickReplies.map((reply, index) => (
            <Button
              key={index}
              variant={reply.label.toLowerCase().includes('end') ? 'secondary' : 'primary'}
              size="sm"
              threeD
              onClick={() => onQuickReply?.(reply.value)}
              className="text-sm flex items-center gap-1"
            >
              {reply.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

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
 
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Auto-scroll to bottom on new message
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messageGroups.length, isTyping]);

  const submit = (e?: React.FormEvent) => {
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
      {/* Enhanced Header */}
      <div className="px-4 py-3 border-b border-neutral-200 flex items-center gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              threeD
              onClick={onBack}
              className="p-2"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="w-8 h-8 rounded-md bg-brand-primary text-white flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <Text variant="h3" size="lg" weight="semibold" className="truncate">
            {title}
          </Text>
        </div>
      </div>

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
          />
        ))}

        {isTyping && (
          <div className="text-left">
            <TypingIndicator />
          </div>
        )}

        {/* Empty state for new chats */}
        {messageGroups.length === 0 && !isTyping && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-brand-primary-50 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-brand-primary" />
            </div>
            <Text variant="h4" size="lg" weight="semibold" className="mb-2">
              Start a conversation
            </Text>
            <Text variant="p" color="muted" className="max-w-md mx-auto">
              Choose from the options above or ask a question to get started.
            </Text>
          </div>
        )}
      </div>

      {/* Always-Visible Composer */}
      <form onSubmit={submit} className="p-3 border-t border-neutral-200 flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && onAttachFiles) onAttachFiles(e.target.files);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="md"
          threeD
          aria-label="Attach files"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={inputPlaceholder}
          className="flex-1 input"
        />
        <Button type="submit" variant="primary" size="md" threeD>
          <Send className="w-4 h-4 mr-1" /> Send
        </Button>
      </form>
    </div>
  );
};

export default ChatPanel;


