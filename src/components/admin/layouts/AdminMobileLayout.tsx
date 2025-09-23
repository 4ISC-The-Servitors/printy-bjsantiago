import React from 'react';
import { AdminMobileHeader, AdminMobileNavbar } from '../_shared/mobile';
import MobileChatPanel from '../../chat/mobile/ChatPanel';

interface AdminMobileLayoutProps {
  title: string;
  headerRight?: React.ReactNode;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  messages: any[];
  isTyping?: boolean;
  quickReplies?: any[];
  onSend: (text: string) => void;
  onQuickReply?: (value: string) => void;
  children: React.ReactNode;
}

const AdminMobileLayout: React.FC<AdminMobileLayoutProps> = ({
  title,
  headerRight,
  open,
  onOpen,
  onClose,
  messages,
  isTyping,
  quickReplies,
  onSend,
  onQuickReply,
  children,
}) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar would be provided by parent when needed */}

      <div className="flex-1 flex flex-col relative min-w-0">
        <AdminMobileHeader
          title={title}
          onMenuClick={() => {}}
          rightContent={headerRight}
        />

        <main className="flex-1 overflow-auto pb-24">
          {open ? (
            <div className="flex flex-col min-h-screen bg-white">
              <MobileChatPanel
                title="Printy Assistant"
                messages={messages}
                onSend={onSend}
                isTyping={isTyping}
                quickReplies={quickReplies}
                onQuickReply={onQuickReply}
                onEndChat={onClose}
              />
            </div>
          ) : (
            children
          )}
        </main>

        <AdminMobileNavbar onOpenChat={onOpen} />
      </div>
    </div>
  );
};

export default AdminMobileLayout;
