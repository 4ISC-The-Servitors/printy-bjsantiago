/**
 * useConversationState
 * Owns chat UI state: messages, conversations, active conversation, typing,
 * quick replies, and input placeholder. Keeps state management separate from
 * data access and flow logic so it can be reused across roles (customer/admin).
 */
import { useState } from 'react';
import type { ChatMessage, QuickReply } from '../../../../components/chat/_shared/types';

export interface ConversationItem {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  flowId: string;
  status: 'active' | 'ended';
  icon?: React.ReactNode;
}

export function useConversationState() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [inputPlaceholder, setInputPlaceholder] = useState('Type a message...');

  return {
    messages,
    setMessages,
    isTyping,
    setIsTyping,
    conversations,
    setConversations,
    activeId,
    setActiveId,
    quickReplies,
    setQuickReplies,
    inputPlaceholder,
    setInputPlaceholder,
  } as const;
}

export default useConversationState;


