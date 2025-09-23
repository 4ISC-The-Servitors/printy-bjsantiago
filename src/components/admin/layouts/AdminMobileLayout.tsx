import React from 'react';
import { AdminMobileHeader, AdminMobileNavbar } from '../_shared/mobile';
import AdminMobileChatOverlay from '../chat/AdminMobileChatOverlay';

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

        <main className="flex-1 overflow-auto pb-24">{children}</main>

        <AdminMobileNavbar onOpenChat={onOpen} />
        <AdminMobileChatOverlay
          open={open}
          messages={messages}
          isTyping={isTyping}
          quickReplies={quickReplies}
          onSend={onSend}
          onQuickReply={onQuickReply}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default AdminMobileLayout;
