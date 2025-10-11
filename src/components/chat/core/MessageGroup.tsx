import React from 'react';
import MessageBubble from './MessageBubble';
import type { ChatMessage, QuickReply } from '../types';
import {
  formatShortTime,
  formatRelativeTimeLabel,
} from '../../../utils/shared';

interface MessageGroupProps {
  messages: ChatMessage[];
  quickReplies?: QuickReply[];
  onQuickReply?: (value: string) => void;
  onEndChat?: () => void;
}

/**
 * Groups messages by role and renders them with timestamps
 * Handles quick replies for bot messages
 */
export const MessageGroup: React.FC<MessageGroupProps> = ({
  messages,
  quickReplies,
  onQuickReply,
  onEndChat,
}) => {
  if (messages.length === 0) return null;

  const isBot = messages[0]?.role === 'printy';
  const mostRecentTs = messages[messages.length - 1]?.ts ?? 0;

  const formatRelativeTime = (ts: number, isMostRecent: boolean): string => {
    if (isMostRecent) return formatRelativeTimeLabel(ts);
    return formatShortTime(ts);
  };

  // Extract image URLs from message text
  const extractImageUrls = (text: string): string[] => {
    const imageUrlRegex =
      /(blob:[^\s]+|https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif)(?:\?[^\s]*)?|\/(?:[\w.-]+)\.(?:jpg|jpeg|png|gif)|data:image\/[a-zA-Z0-9+]+;base64,[^\s)]+)/gi;
    return Array.from(text.matchAll(imageUrlRegex)).map(match => match[0]);
  };

  const removeImageTokens = (text: string): string => {
    const imageUrlRegex =
      /(blob:[^\s]+|https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif)(?:\?[^\s]*)?|\/(?:[\w.-]+)\.(?:jpg|jpeg|png|gif)|data:image\/[a-zA-Z0-9+]+;base64,[^\s)]+)/gi;
    return text
      .replace(imageUrlRegex, '')
      .replace(/\(\s*\)/g, ' ')
      .trim();
  };

  return (
    <div className={`space-y-2 ${isBot ? 'text-left' : 'text-right'}`}>
      {messages.map(m => {
        const preserveNewlines =
          isBot &&
          /Order .* — Status: /.test(m.text) &&
          m.text.includes('Items:');
        const imageUrls = extractImageUrls(m.text || '');
        const cleanText = removeImageTokens(m.text || '');

        return (
          <MessageBubble
            key={m.id}
            role={m.role}
            text={cleanText}
            timestamp={formatRelativeTime(m.ts, m.ts === mostRecentTs)}
            imageUrls={imageUrls}
            preserveNewlines={preserveNewlines}
            showAvatar={true}
            showTimestamp={true}
          />
        );
      })}

      {/* Quick Replies for bot messages */}
      {isBot && quickReplies && quickReplies.length > 0 && (
        <QuickReplyGrid
          replies={quickReplies}
          onQuickReply={onQuickReply}
          onEndChat={onEndChat}
        />
      )}
    </div>
  );
};

// Quick Reply Grid Component (extracted for reusability)
interface QuickReplyGridProps {
  replies: QuickReply[];
  onQuickReply?: (value: string) => void;
  onEndChat?: () => void;
}

const QuickReplyGrid: React.FC<QuickReplyGridProps> = ({
  replies,
  onQuickReply,
  onEndChat,
}) => {
  const endLabels = new Set([
    'end',
    'end chat',
    'close chat',
    'end conversation',
    'finish',
    'done',
  ]);

  return (
    <div className="flex flex-wrap gap-3 mt-3 ml-6 sm:gap-3 sm:ml-8">
      {replies.map((reply, index) => {
        const isEnd = endLabels.has(reply.label.trim().toLowerCase());
        const handleClick = () => {
          if (isEnd) {
            onEndChat?.();
          } else {
            onQuickReply?.(reply.value);
          }
        };

        return (
          <button
            key={index}
            onClick={handleClick}
            className={`
              px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all
              ${
                isEnd
                  ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  : 'bg-brand-primary text-white hover:bg-brand-primary-900'
              }
              active:scale-95
            `}
          >
            {reply.label}
          </button>
        );
      })}
    </div>
  );
};

export default MessageGroup;
