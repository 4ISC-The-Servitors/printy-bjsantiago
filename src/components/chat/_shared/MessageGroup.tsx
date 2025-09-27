import React from 'react';
import { Bot, User } from 'lucide-react';
import { Button } from '../../shared';
import type { ChatMessage, QuickReply } from './types';

import {
  formatShortTime,
  formatRelativeTimeLabel,
} from '../../../utils/shared';
function formatRelativeTime(ts: number, isMostRecent: boolean): string {
  if (isMostRecent) return formatRelativeTimeLabel(ts);
  return formatShortTime(ts);
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
  onEndChat,
}) => {
  const isBot = messages[0]?.role === 'printy';
  const mostRecentTs = messages[messages.length - 1]?.ts ?? 0;
  // const lastTs = messages[messages.length - 1]?.ts ?? Date.now();

  return (
    <div className={`space-y-2 ${isBot ? 'text-left' : 'text-right'}`}>
      {messages.map(m => {
        // ====================
        const preserveNewlinesForOrder =
          isBot &&
          /Order .* — Status: /.test(m.text) &&
          m.text.includes('Items:');
        // Extract inline image URLs (supports public path, http(s), blob:, and data URLs)
        const imageUrlRegex =
          /(blob:[^\s]+|https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif)(?:\?[^\s]*)?|\/(?:[\w.-]+)\.(?:jpg|jpeg|png|gif)|data:image\/[a-zA-Z0-9+]+;base64,[^\s)]+)/gi;
        const imageMatches = Array.from(
          (m.text || '').matchAll(imageUrlRegex)
        ).map(match => match[0]);
        const textWithoutImageTokens = (m.text || '')
          .replace(imageUrlRegex, '')
          .replace(/\(\s*\)/g, ' ')
          .trim();
        return (
          <div key={m.id} className={isBot ? 'text-left' : 'text-right'}>
            <div className="flex items-start gap-2">
              {isBot && (
                <div className="w-6 h-6 rounded-md bg-brand-primary text-white flex items-center justify-center text-xs mt-1 sm:w-8 sm:h-8">
                  <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              )}
              <div
                className={
                  isBot
                    ? 'inline-block max-w-[85%]'
                    : 'inline-block max-w-[85%] ml-auto'
                }
              >
                <div
                  className={
                    'rounded-2xl px-3 py-2 text-sm break-words ' +
                    (preserveNewlinesForOrder ? 'whitespace-pre-wrap ' : '') +
                    'leading-relaxed transition-all duration-200 ' +
                    'sm:px-4 sm:py-3 sm:text-base ' +
                    (isBot
                      ? 'bg-brand-primary-50 text-neutral-700'
                      : 'bg-brand-primary text-white text-left')
                  }
                >
                  {isBot &&
                    messages.length > 1 &&
                    messages.indexOf(m) === 0 && (
                      <div className="text-xs text-neutral-500 mb-1">
                        Assistant
                      </div>
                    )}
                  {textWithoutImageTokens && (
                    <div
                      className={
                        preserveNewlinesForOrder ? '' : 'whitespace-pre-wrap'
                      }
                    >
                      {textWithoutImageTokens}
                    </div>
                  )}
                  {(imageMatches.length > 0 || m.imageUrl) && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {/* Display image from imageUrl property */}
                      {m.imageUrl && (
                        <a
                          href={m.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg overflow-hidden border border-neutral-200 bg-white block group"
                          aria-label="Open uploaded image"
                          title="Open image in new tab"
                        >
                          <img
                            src={m.imageUrl}
                            alt="Uploaded image"
                            className="w-full h-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] cursor-zoom-in"
                          />
                        </a>
                      )}
                      {/* Display images from text URLs */}
                      {imageMatches.map((src, idx) => (
                        <a
                          key={idx}
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg overflow-hidden border border-neutral-200 bg-white block group"
                          aria-label={`Open attachment ${idx + 1}`}
                          title="Open image in new tab"
                        >
                          <img
                            src={src}
                            alt={`attachment-${idx + 1}`}
                            className="w-full h-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] cursor-zoom-in"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                {/* Per-message timestamp directly under bubble within same width */}
                <div
                  className={`text-xs text-neutral-500 mt-1 ${isBot ? 'text-right' : 'text-left'}`}
                >
                  {formatRelativeTime(m.ts, m.ts === mostRecentTs)}
                </div>
              </div>
              {!isBot && (
                <div className="w-6 h-6 rounded-md bg-neutral-600 text-white flex items-center justify-center text-xs mt-1 sm:w-8 sm:h-8">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Quick Replies under bot messages */}
      {isBot && quickReplies && quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3 ml-6 sm:gap-3 sm:ml-8">
          {quickReplies.map((reply, index) => {
            const endLabels = new Set([
              'end',
              'end chat',
              'close chat',
              'end conversation',
              'finish',
              'done',
            ]);
            const isEnd = endLabels.has(reply.label.trim().toLowerCase());
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
