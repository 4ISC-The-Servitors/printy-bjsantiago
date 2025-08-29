import React from 'react';
import type { ChatMessage } from '../chat/types';
import { Bot, User, LogOut, MessageSquare } from 'lucide-react';
import { Button, Text, Badge } from '../shared';

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  flowId: string;
  status: 'active' | 'completed';
  icon?: React.ReactNode;
}

interface DesktopSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSwitchConversation: (id: string) => void;
  onNavigateToAccount: () => void;
  onLogout: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  conversations,
  activeId,
  onSwitchConversation,
  onNavigateToAccount,
  onLogout,
}) => {
  return (
    <aside className="hidden lg:flex w-80 bg-white border-r border-neutral-200 flex-col">
      <div className="p-4 shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-brand-primary text-white flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <Text
              variant="h3"
              size="lg"
              weight="bold"
              className="text-brand-primary"
            >
              Printy
            </Text>
            <Text variant="p" size="xs" color="muted">
              B.J. Santiago Inc.
            </Text>
          </div>
        </div>
      </div>

      {/* Scrollable Chats Section */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4">
        {conversations.length > 0 && (
          <div className="mb-4">
            <Text
              variant="h3"
              size="sm"
              weight="semibold"
              className="px-1 pb-2 text-neutral-600"
            >
              Chats
            </Text>
            <div className="space-y-2">
              {conversations.map(c => {
                const lastBotMessage = [...c.messages]
                  .reverse()
                  .find(m => m.role === 'printy');

                return (
                  <button
                    key={c.id}
                    onClick={() => onSwitchConversation(c.id)}
                    className={
                      'w-full text-left rounded-lg border px-3 py-3 transition-colors ' +
                      (c.id === activeId
                        ? 'bg-brand-primary-50 border-brand-primary'
                        : 'bg-white border-neutral-200 hover:bg-neutral-50')
                    }
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-md bg-brand-primary text-white flex items-center justify-center text-xs mt-0.5">
                        {c.icon || <MessageSquare className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Text
                            variant="h4"
                            size="sm"
                            weight="semibold"
                            className="truncate"
                          >
                            {c.title}
                          </Text>
                          <Badge
                            variant={
                              c.status === 'active' ? 'success' : 'error'
                            }
                            size="sm"
                          >
                            {c.status === 'active' ? 'Active' : 'Ended'}
                          </Badge>
                        </div>
                        <Text
                          variant="p"
                          size="xs"
                          color="muted"
                          className="truncate"
                        >
                          {lastBotMessage?.text.substring(0, 60) ||
                            'No messages yet'}
                          {(lastBotMessage?.text.length || 0) > 60 ? '...' : ''}
                        </Text>
                        <Text
                          variant="p"
                          size="xs"
                          color="muted"
                          className="mt-1"
                        >
                          {new Date(c.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Sidebar Section */}
      <div className="p-4 border-t border-neutral-200 shrink-0">
        <div className="space-y-4">
          <Button
            variant="secondary"
            className="w-full justify-start"
            threeD
            onClick={onNavigateToAccount}
          >
            <User className="w-4 h-4 mr-2" /> Account
          </Button>
          <Button
            variant="accent"
            className="w-full justify-start"
            threeD
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
