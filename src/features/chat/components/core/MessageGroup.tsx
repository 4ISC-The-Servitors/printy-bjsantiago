import React, { useState, useEffect, useMemo } from 'react';
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

  // Treat group as historical if prop is set OR all messages are flagged historical
  const isHistoricalGroup =
    isHistorical || messages.every(m => m.isHistorical === true);

  // Determine if we should animate (only for new messages in active conversations, not historical)
  const shouldAnimate =
    isBot && !hasAnimated && !readOnly && !isHistoricalGroup;

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
    if (!isBot || readOnly || isHistoricalGroup) {
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
  }, [
    messages.length,
    isBot,
    initialMessageCount,
    readOnly,
    isHistoricalGroup,
  ]);

  const formatRelativeTime = (ts: number, isMostRecent: boolean): string => {
    if (isMostRecent) return formatRelativeTimeLabel(ts);
    return formatShortTime(ts);
  };

  // Extract image URLs from message text
  // Filter out blob URLs and data URLs (they're temporary and won't persist)
  // Keep supabase:// URLs as they persist in storage
  const extractImageUrls = (text: string): string[] => {
    if (!text || typeof text !== 'string') return [];

    // Don't extract images from conversation history blocks
    // These should render inline within the text
    if (
      text.includes('Conversation History:') ||
      text.includes('NEW TICKET REQUEST')
    ) {
      return [];
    }

    const imageUrlRegex =
      /(blob:[^\s]+|https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?|\/(?:[\w.-]+)\.(?:jpg|jpeg|png|gif|webp)|data:image\/[a-zA-Z0-9+]+;base64,[^\s)]+|supabase:\/\/payment-proofs\/[^\s,\"')\]]+|supabase:\/\/ticket-uploads\/[^\s,\"')\]]+)/gi;
    const matches = Array.from(text.matchAll(imageUrlRegex)).map(
      match => match[0]
    );

    // Always filter out blob URLs and data URLs - they're temporary and won't work in history
    // Keep supabase:// URLs and http/https URLs as they persist and de-duplicate
    const filtered = matches.filter(
      url => !url.startsWith('blob:') && !url.startsWith('data:image/')
    );
    return Array.from(new Set(filtered));
  };

  const removeImageTokens = (text: string): string => {
    if (!text || typeof text !== 'string') return '';

    // Don't remove images from conversation history blocks
    // These should render inline within the text
    if (
      text.includes('Conversation History:') ||
      text.includes('NEW TICKET REQUEST')
    ) {
      return text;
    }

    // Remove image URLs from display text, but keep the message readable
    const imageUrlRegex =
      /(blob:[^\s]+|https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?|\/(?:[\w.-]+)\.(?:jpg|jpeg|png|gif|webp)|data:image\/[a-zA-Z0-9+]+;base64,[^\s)]+|supabase:\/\/payment-proofs\/[^\s,\"')\]]+|supabase:\/\/ticket-uploads\/[^\s,\"')\]]+)/gi;
    return text
      .replace(imageUrlRegex, '')
      .replace(/\(\s*\)/g, ' ')
      .trim();
  };

  // Get visible messages (for bot animation or show all if already animated)
  const visibleMessages =
    isBot && shouldAnimate ? messages.slice(0, visibleCount) : messages;

  // Memoize processed messages to prevent creating new arrays on every render
  const processedMessages = useMemo(() => {
    return visibleMessages.map(m => ({
      ...m,
      imageUrls: extractImageUrls(m.text || ''),
      cleanText: removeImageTokens(m.text || ''),
      preserveNewlines:
        isBot &&
        /Order .* — Status: /.test(m.text) &&
        m.text.includes('Items:'),
    }));
  }, [visibleMessages, isBot]);

  return (
    <div className={`space-y-2 ${isBot ? 'text-left' : 'text-right'}`}>
      {processedMessages.map((m, index) => (
        <MessageBubble
          key={`${m.id}-${m.ts}-${index}`}
          role={m.role}
          text={m.cleanText}
          timestamp={formatRelativeTime(m.ts, m.ts === mostRecentTs)}
          imageUrls={m.imageUrls}
          preserveNewlines={m.preserveNewlines}
          showAvatar={true}
          showTimestamp={true}
          metadata={(m as any).metadata}
        />
      ))}

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
