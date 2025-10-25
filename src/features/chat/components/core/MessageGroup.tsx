import React, { useState, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { QuickReplyGrid } from './QuickReply';
import TypingIndicator from './TypingIndicator';
import type { ChatMessage, QuickReply } from '@features/chat/types';
import { formatShortTime, formatRelativeTimeLabel } from '@shared/utils';

interface MessageGroupProps {
  messages: ChatMessage[];
  quickReplies?: QuickReply[];
  onQuickReply?: (value: string | { value: string; label: string }) => void;
  onEndChat?: () => void;
  readOnly?: boolean; // Indicates if conversation has ended - no animation
  isHistorical?: boolean; // Indicates if these are existing messages from database - no typing animation
  userRole?: 'admin' | 'customer';
  sessionId?: string;
  conversationId?: string;
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
  readOnly = false,
  isHistorical = false,
  userRole,
  sessionId,
  conversationId,
}) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [initialMessageCount] = useState(messages.length);

  if (messages.length === 0) return null;

  const isBot = messages[0]?.role === 'printy';
  const mostRecentTs = messages[messages.length - 1]?.ts ?? 0;

  // Determine if we should animate (only for new messages in active conversations, not historical)
  const shouldAnimate = isBot && !hasAnimated && !readOnly && !isHistorical;

  // Animate bot messages appearing one by one with typing indicator
  useEffect(() => {
    if (shouldAnimate && visibleCount < messages.length) {
      // Show typing indicator
      setShowTyping(true);

      // Hide typing indicator and show next message after delay
      const typingDelay = Math.min(
        500 + (messages[visibleCount]?.text?.length || 0) * 10,
        2000
      );
      const timer = setTimeout(() => {
        setShowTyping(false);
        setVisibleCount(prev => prev + 1);
      }, typingDelay);

      return () => clearTimeout(timer);
    } else if (shouldAnimate && visibleCount >= messages.length) {
      // Animation complete
      setHasAnimated(true);
    }
  }, [visibleCount, messages.length, shouldAnimate, messages]);

  // Initialize visible count
  useEffect(() => {
    if (!isBot || readOnly || isHistorical) {
      // User messages, ended conversations, or historical messages - appear instantly
      setVisibleCount(messages.length);
      setHasAnimated(true);
    } else if (messages.length === initialMessageCount) {
      // This is the initial render - start animation from 0
      setVisibleCount(0);
      setHasAnimated(false);
    } else {
      // New messages added to existing group - show all immediately (no re-animation)
      setVisibleCount(messages.length);
      setHasAnimated(true);
    }
  }, [messages.length, isBot, initialMessageCount, readOnly, isHistorical]);

  const formatRelativeTime = (ts: number, isMostRecent: boolean): string => {
    if (isMostRecent) return formatRelativeTimeLabel(ts);
    return formatShortTime(ts);
  };

  // Extract image URLs from message text
  const extractImageUrls = (text: string): string[] => {
    if (!text || typeof text !== 'string') return [];
    const imageUrlRegex =
      /(blob:[^\s]+|https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif)(?:\?[^\s]*)?|\/(?:[\w.-]+)\.(?:jpg|jpeg|png|gif)|data:image\/[a-zA-Z0-9+]+;base64,[^\s)]+|supabase:\/\/payment-proofs\/[^\s]+)/gi;
    return Array.from(text.matchAll(imageUrlRegex)).map(match => match[0]);
  };

  const removeImageTokens = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    const imageUrlRegex =
      /(blob:[^\s]+|https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif)(?:\?[^\s]*)?|\/(?:[\w.-]+)\.(?:jpg|jpeg|png|gif)|data:image\/[a-zA-Z0-9+]+;base64,[^\s)]+|supabase:\/\/payment-proofs\/[^\s]+)/gi;
    return text
      .replace(imageUrlRegex, '')
      .replace(/\(\s*\)/g, ' ')
      .trim();
  };

  // Get visible messages (for bot animation or show all if already animated)
  const visibleMessages =
    isBot && shouldAnimate ? messages.slice(0, visibleCount) : messages;

  return (
    <div className={`space-y-2 ${isBot ? 'text-left' : 'text-right'}`}>
      {visibleMessages.map((m, index) => {
        const preserveNewlines =
          isBot &&
          /Order .* — Status: /.test(m.text) &&
          m.text.includes('Items:');
        const imageUrls = extractImageUrls(m.text || '');
        const cleanText = removeImageTokens(m.text || '');

        return (
          <MessageBubble
            key={`${m.id}-${m.ts}-${index}`}
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

      {/* Show typing indicator while bot is "typing" (only during animation) */}
      {isBot && shouldAnimate && showTyping && <TypingIndicator />}

      {/* Quick Replies for bot messages - show when all messages are visible or animation is done */}
      {isBot &&
        quickReplies &&
        quickReplies.length > 0 &&
        (hasAnimated || visibleCount >= messages.length) && (
          <QuickReplyGrid
            replies={quickReplies}
            onQuickReply={onQuickReply}
            onEndChat={onEndChat}
            userRole={userRole}
            sessionId={sessionId}
            conversationId={conversationId}
          />
        )}
    </div>
  );
};

export default MessageGroup;
