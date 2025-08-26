import React from 'react';
import { Bot, User } from 'lucide-react';
import { Button } from '../shared';
import type { ChatMessage, QuickReply } from './types';

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

interface MessageGroupProps {
  messages: ChatMessage[];
  quickReplies?: QuickReply[];
  onQuickReply?: (value: string) => void;
  onEndChat?: () => void;
}

export const MessageGroup: React.FC<MessageGroupProps> = ({ 
  messages, 
  quickReplies, 
  onQuickReply, 
  onEndChat 
}) => {
  const isBot = messages[0]?.role === 'printy';
  const lastTs = messages[messages.length - 1]?.ts ?? Date.now();
  
  return (
    <div className={`space-y-2 ${isBot ? 'text-left' : 'text-right'}`}>
      {messages.map((m) => (
        <div key={m.id} className={isBot ? 'text-left' : 'text-right'}>
          <div className="flex items-start gap-2">
            {isBot && (
              <div className="w-6 h-6 rounded-md bg-brand-primary text-white flex items-center justify-center text-xs mt-1 sm:w-8 sm:h-8">
                <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            )}
            <div
              className={
                'inline-block rounded-2xl px-3 py-2 text-sm break-words max-w-[85%] leading-relaxed transition-all duration-200 ' +
                'sm:px-4 sm:py-3 sm:text-base ' +
                (isBot
                  ? 'bg-brand-primary-50 text-neutral-700'
                  : 'bg-brand-primary text-white ml-auto text-left')
              }
            >
              {isBot && messages.length > 1 && messages.indexOf(m) === 0 && (
                <div className="text-xs text-neutral-500 mb-1">Assistant</div>
              )}
              {m.text}
            </div>
            {!isBot && (
              <div className="w-6 h-6 rounded-md bg-neutral-600 text-white flex items-center justify-center text-xs mt-1 sm:w-8 sm:h-8">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
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
        <div className="flex flex-wrap gap-3 mt-3 ml-6 sm:gap-3 sm:ml-8">
          {quickReplies.map((reply, index) => {
            const isEnd = reply.label.toLowerCase().includes('end');
            const handleClick = () => {
              if (isEnd) {
                onEndChat?.();
              } else {
                onQuickReply?.(reply.value);
              }
            };
            return (
              <Button
                key={index}
                variant={isEnd ? 'secondary' : 'primary'}
                size="xs"
                threeD
                onClick={handleClick}
                className="text-xs flex items-center gap-1 sm:h-9 sm:px-3 sm:text-sm"
              >
                {reply.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessageGroup;
