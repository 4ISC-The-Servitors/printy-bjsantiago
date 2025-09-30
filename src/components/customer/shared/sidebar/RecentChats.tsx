import React, { useMemo } from 'react';
import type { ChatMessage } from '../../../chat/_shared/types';
import { Bot } from 'lucide-react';
import { Badge } from '../../../shared';
import { formatLongDate } from '../../../../utils/shared/dateFormatter';
import { formatShortTime } from '../../../../utils/shared/timeFormatter';
import useResponsiveListItems from '../../../../hooks/shared/useResponsiveListItems';

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  flowId: string;
  status: 'active' | 'ended';
  icon?: React.ReactNode;
}

interface RecentChatsProps {
  conversations: Conversation[];
  activeId: string | null;
  onSwitchConversation: (id: string) => void;
  getContainerHeight?: () => number | null;
}

const RecentChats: React.FC<RecentChatsProps> = ({
  conversations,
  activeId,
  onSwitchConversation,
  getContainerHeight,
}) => {
  if (!conversations || conversations.length === 0) {
    // If the user is authenticated, there may be history loading; show a hint
    const hasUser = typeof window !== 'undefined' && !!localStorage.getItem('sb-uid');
    return (
      <div className="px-2 py-2 text-xs text-neutral-500">
        No recent chats yet{hasUser ? ' • Loading chats...' : ''}
      </div>
    );
  }

  // Dynamically limit the number of items based on available height in the scroll area
  const maxVisible = useResponsiveListItems(
    () => (getContainerHeight ? getContainerHeight() : null),
    { itemHeight: 60, min: 3, max: 20, observeEl: () => document.querySelector('.recent-chats-container') }
  );

  const items = useMemo(() => conversations.slice(0, maxVisible), [conversations, maxVisible]);

  return (
    <div className="space-y-2 recent-chats-container">
      {items.map(c => (
        <button
          key={c.id}
          onClick={() => onSwitchConversation(c.id)}
          className={
            'w-full text-left rounded-md border px-3 py-2 transition-colors ' +
            (c.id === activeId
              ? 'bg-brand-primary-50 border-brand-primary'
              : 'bg-white border-neutral-200 hover:bg-neutral-50')
          }
          title={c.title}
        >
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-primary text-white flex items-center justify-center text-xs mt-0.5">
              {c.icon || <Bot className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="font-semibold text-sm truncate">{c.title}</div>
                <Badge variant={c.status === 'active' ? 'success' : 'error'} size="sm">
                  {c.status === 'active' ? 'Active' : 'Ended'}
                </Badge>
              </div>
              <div className="text-xs text-neutral-500">
                {formatLongDate(c.createdAt)} • {formatShortTime(c.createdAt)}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default RecentChats;


