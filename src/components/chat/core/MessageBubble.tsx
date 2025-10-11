import React from 'react';
import { Bot, User } from 'lucide-react';

export interface MessageBubbleProps {
  role: 'user' | 'printy';
  text: string;
  timestamp?: string;
  imageUrls?: string[];
  preserveNewlines?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

/**
 * Single message bubble component
 * Displays user or bot messages with optional avatar and timestamp
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  text,
  timestamp,
  imageUrls = [],
  preserveNewlines = false,
  showAvatar = true,
  showTimestamp = true,
}) => {
  const isBot = role === 'printy';

  return (
    <div className={isBot ? 'text-left' : 'text-right'}>
      <div className="flex items-start gap-2">
        {isBot && showAvatar && (
          <div className="w-6 h-6 rounded-md bg-brand-primary text-white flex items-center justify-center text-xs mt-1 sm:w-8 sm:h-8 shrink-0">
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
              (preserveNewlines ? 'whitespace-pre-wrap ' : '') +
              'leading-relaxed transition-all duration-200 ' +
              'sm:px-4 sm:py-3 sm:text-base ' +
              (isBot
                ? 'bg-brand-primary-50 text-neutral-700'
                : 'bg-brand-primary text-white text-left')
            }
          >
            {text && (
              <div className={preserveNewlines ? '' : 'whitespace-pre-wrap'}>
                {text}
              </div>
            )}

            {imageUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {imageUrls.map((src, idx) => (
                  <a
                    key={idx}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg overflow-hidden border border-neutral-200 bg-white block group"
                    aria-label={`Open attachment ${idx + 1}`}
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

          {showTimestamp && timestamp && (
            <div
              className={`text-xs text-neutral-500 mt-1 ${isBot ? 'text-right' : 'text-left'}`}
            >
              {timestamp}
            </div>
          )}
        </div>

        {!isBot && showAvatar && (
          <div className="w-6 h-6 rounded-md bg-neutral-600 text-white flex items-center justify-center text-xs mt-1 sm:w-8 sm:h-8 shrink-0">
            <User className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
