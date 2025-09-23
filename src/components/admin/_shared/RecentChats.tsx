import React from 'react';
import { Text, Badge } from '../../shared';
import { useAdminConversations } from '@hooks/admin/useAdminConversations';

interface RecentChatsProps {
  onSelect?: (conversationId: string) => void;
  limit?: number;
  className?: string;
  showHeader?: boolean;
}

const RecentChats: React.FC<RecentChatsProps> = ({ limit = 8, className, showHeader = true }) => {
  const { conversations, setActive } = useAdminConversations();
  const items = conversations
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);

  return (
    <div className={className}>
      {showHeader && (
        <Text variant="p" size="xs" color="muted" className="px-1 mb-2">
          Recent Chats
        </Text>
      )}
      {items.length === 0 ? (
        <Text variant="p" size="xs" color="muted" className="px-1">
          No recent chats yet.
        </Text>
      ) : (
        <div className="space-y-2">
          {items.map(c => {
            const lastBotMessage = [...c.messages]
              .reverse()
              .find((m: any) => m.role === 'printy');
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActive(c.id);
                  window.dispatchEvent(
                    new CustomEvent('admin-chat-open', {
                      detail: { conversationId: c.id },
                    })
                  );
                }}
                className="w-full text-left rounded-lg border px-3 py-3 transition-colors bg-white border-neutral-200 hover:bg-neutral-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Text
                      variant="h4"
                      size="sm"
                      weight="semibold"
                      className="truncate"
                    >
                      {c.title}
                    </Text>
                    <Badge variant={c.status === 'active' ? 'success' : 'error'} size="sm">
                      {c.status === 'active' ? 'Active' : 'Ended'}
                    </Badge>
                  </div>
                  <Text variant="p" size="xs" color="muted" className="truncate">
                    {lastBotMessage?.text?.substring(0, 60) || 'No messages yet'}
                    {(lastBotMessage?.text?.length || 0) > 60 ? '...' : ''}
                  </Text>
                  <Text variant="p" size="xs" color="muted" className="mt-1">
                    {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentChats;


