import React from 'react';
import { useAdminConversations } from '@hooks/admin/useAdminConversations';
import { Card, Text, Badge } from '@components/shared';

const AdminChatsPage: React.FC = () => {
  const { conversations, setActive } = useAdminConversations();

  const items = conversations
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const handleOpen = (id: string) => {
    setActive(id);
    window.dispatchEvent(new CustomEvent('admin-chat-open'));
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <Text variant="h3" size="xl" weight="bold">All Chats</Text>
        <Text variant="p" size="sm" color="muted">Recent conversations across admin assistants</Text>
      </div>

      {items.length === 0 ? (
        <Card className="p-4">
          <Text variant="p" size="sm" color="muted">No conversations yet.</Text>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(c => {
            const lastBotMessage = [...c.messages]
              .reverse()
              .find((m: any) => m.role === 'printy');
            return (
              <button
                key={c.id}
                onClick={() => handleOpen(c.id)}
                className="w-full text-left rounded-lg border px-4 py-4 transition-colors bg-white border-neutral-200 hover:bg-neutral-50"
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
                    {lastBotMessage?.text?.substring(0, 100) || 'No messages yet'}
                    {(lastBotMessage?.text?.length || 0) > 100 ? '...' : ''}
                  </Text>
                  <Text variant="p" size="xs" color="muted" className="mt-1">
                    {new Date(c.updatedAt).toLocaleString()}
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

export default AdminChatsPage;


