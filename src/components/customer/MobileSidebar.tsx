import React from 'react';
import type { ChatMessage } from '../chat/types';
import { Bot, User, LogOut, MessageSquare } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  flowId: string;
  status: 'active' | 'completed';
  icon?: React.ReactNode;
}

interface MobileSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSwitchConversation: (id: string) => void;
  onNavigateToAccount: () => void;
  onLogout: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  conversations,
  activeId,
  onSwitchConversation,
  onNavigateToAccount,
  onLogout,
}) => {
  return (
    <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-16 bg-white border-r border-neutral-200 flex flex-col items-center py-4 z-50">
      {/* Logo */}
      <div className="w-10 h-10 rounded-lg bg-brand-primary text-white flex items-center justify-center mb-6">
        <Bot className="w-5 h-5" />
      </div>

      {/* Chat Icons */}
      <div className="flex-1 w-full space-y-2 px-2 overflow-y-auto scrollbar-hide">
        {conversations.map(c => (
          <button
            key={c.id}
            onClick={() => onSwitchConversation(c.id)}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
              c.id === activeId
                ? 'bg-brand-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
            title={c.title}
          >
            {c.icon || <MessageSquare className="w-4 h-4" />}
          </button>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="space-y-2 w-full px-2">
        <button
          onClick={onNavigateToAccount}
          className="w-12 h-12 rounded-lg bg-neutral-200 text-neutral-700 hover:bg-neutral-300 flex items-center justify-center transition-colors"
          title="Account"
        >
          <User className="w-4 h-4" />
        </button>
        <button
          onClick={onLogout}
          className="w-12 h-12 rounded-lg bg-brand-accent text-white hover:bg-brand-accent/90 flex items-center justify-center transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default MobileSidebar;
