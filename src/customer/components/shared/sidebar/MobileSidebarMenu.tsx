import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bot, X, User } from 'lucide-react';
import { Button, Text } from '@shared/components';
import RecentChats from './RecentChats';
import ViewAllChat from './ViewAllChat';
import type { ChatMessage } from '@features/chat/types/chat';

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  flowId: string;
  status: 'active' | 'ended';
  icon?: React.ReactNode;
}

export interface CustomerMobileSidebarMenuProps {
  conversations: Conversation[];
  activeId: string | null;
  onClose: () => void;
  onSwitchConversation: (id: string) => void;
  onAccount: () => void;
  onLogout: () => void;
}

/**
 * Customer mobile sidebar menu overlay
 * - Mirrors SidebarPanel.tsx styling exactly
 * - Full-height panel with header, primary chat entry, and bottom actions
 */
const CustomerMobileSidebarMenu: React.FC<CustomerMobileSidebarMenuProps> = ({
  conversations,
  activeId,
  onClose,
  onSwitchConversation,
  onAccount,
  onLogout,
}) => {
  const navigate = useNavigate();
  const listContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-full flex flex-col">
      {/* Header - matches SidebarPanel exactly */}
      <div className="p-4 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-primary text-white flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="text-brand-primary font-bold">Printy</div>
              <div className="text-xs text-neutral-500">B.J. Santiago Inc.</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 shrink-0"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area - matches SidebarPanel structure */}
      <div className="flex-1 px-3 min-h-0 flex flex-col">
        {/* Chats Section */}
        <div className="mb-2 shrink-0">
          <div className="flex items-center justify-between px-2">
            <Text
              variant="h3"
              size="sm"
              weight="semibold"
              className="text-neutral-700"
            >
              Recent Chats
            </Text>
            <ViewAllChat onClick={() => navigate('/customer/chats')} />
          </div>
          <div className="mt-2 border-t border-neutral-200" />
        </div>

        {/* Recent chats area - flexible height that fills available space */}
        <div
          ref={listContainerRef}
          className="flex-1 overflow-hidden recent-chats-area min-h-0"
        >
          <RecentChats
            conversations={conversations as any}
            activeId={activeId}
            onSwitchConversation={onSwitchConversation}
            getContainerHeight={() =>
              listContainerRef.current
                ? listContainerRef.current.getBoundingClientRect().height
                : 0
            }
          />
        </div>
      </div>

      {/* Bottom Actions - matches SidebarPanel exactly */}
      <div className="p-3 border-t border-neutral-200 shrink-0 space-y-4">
        {/* Account Button - matches AccountButton.tsx */}
        <Button
          variant="secondary"
          className="w-full justify-start"
          threeD
          onClick={onAccount}
        >
          <User className="w-4 h-4 mr-2" /> Account
        </Button>

        {/* Logout Button - matches LogoutButton.tsx */}
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
  );
};

export default CustomerMobileSidebarMenu;
