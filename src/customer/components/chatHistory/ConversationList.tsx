import React from 'react';
import ConversationItem from './ConversationItem';
import type { ChatMessage } from '@features/chat/types/chat';

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  status: 'active' | 'ended';
}

interface ConversationListProps {
  conversations: Conversation[];
  onOpen: (id: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onOpen,
}) => {
  if (!conversations || conversations.length === 0) return null;
  return (
    <div className="space-y-2">
      {conversations.map(c => (
        <ConversationItem key={c.id} {...c} onOpen={onOpen} />
      ))}
    </div>
  );
};

export default ConversationList;
