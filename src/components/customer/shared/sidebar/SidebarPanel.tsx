import React, { useRef } from 'react';
import type { ChatMessage } from '../../../chat/_shared/types';
import { Bot } from 'lucide-react';
import AccountButton from './AccountButton';
import { Text } from '../../../shared';
import RecentChats from './RecentChats';
import ViewAllChat from './ViewAllChat';

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  flowId: string;
  status: 'active' | 'ended';
  icon?: React.ReactNode;
}

interface SidebarPanelProps {
  conversations: Conversation[];
  activeId: string | null;
  onSwitchConversation: (id: string) => void;
  onNavigateToAccount: () => void;
  bottomActions?: React.ReactNode; // e.g., LogoutButton
}

const SidebarPanel: React.FC<SidebarPanelProps> = ({
  conversations,
  activeId,
  onSwitchConversation,
  onNavigateToAccount,
  bottomActions,
}) => {
  const listContainerRef = React.useRef<HTMLDivElement>(null);
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-brand-primary text-white flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="text-brand-primary font-bold">Printy</div>
            <div className="text-xs text-neutral-500">B.J. Santiago Inc.</div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3">
        <div className="mb-2">
          <div className="flex items-center justify-between px-2">
            <Text variant="h3" size="sm" weight="semibold" className="text-neutral-700">
              Recent Chats
            </Text>
            <ViewAllChat onClick={() => window.location.assign('/customer/chats')} />
          </div>
          <div className="mt-2 border-t border-neutral-200" />
        </div>
        {/* Fixed recent chats area; compute how many items fit in the available height */}
        <div ref={listContainerRef} className="overflow-hidden recent-chats-area" style={{ height: 'calc(80% - 0px)' }}>
          <RecentChats
            conversations={conversations as any}
            activeId={activeId}
            onSwitchConversation={onSwitchConversation}
            getContainerHeight={() => listContainerRef.current ? listContainerRef.current.getBoundingClientRect().height : 0}
          />
        </div>
      </div>

      <div className="p-3 border-t border-neutral-200 shrink-0 space-y-4">
        <AccountButton onClick={onNavigateToAccount} />
        {bottomActions}
      </div>
    </div>
  );
};

export default SidebarPanel;


