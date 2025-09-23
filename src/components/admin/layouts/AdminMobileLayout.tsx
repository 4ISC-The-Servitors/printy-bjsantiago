import React, { useState } from 'react';
import { AdminMobileHeader, AdminMobileNavbar } from '../_shared/mobile';
import { AdminMobileSidebar } from '../_shared/mobile';
import { useToast } from '../../../lib/useToast';
import ToastContainer from '../../shared/ToastContainer';
import Modal from '../../shared/Modal';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, toast] = useToast({ position: 'top-center', duration: 2500 });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar would be provided by parent when needed */}

      <div className="flex-1 flex flex-col relative min-w-0">
        <AdminMobileHeader
          title={title}
          onMenuClick={() => setIsSidebarOpen(true)}
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
        <AdminMobileSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSettingsClick={() => {
            setIsSidebarOpen(false);
            window.location.href = '/admin/settings';
          }}
          onLogoutClick={() => {
            setIsSidebarOpen(false);
            setShowLogoutConfirm(true);
          }}
        />
        <Modal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} size="sm">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200">
            <Modal.Header onClose={() => setShowLogoutConfirm(false)}>
              <div className="text-base font-semibold text-neutral-900">Confirm Logout</div>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-neutral-600">Are you sure you want to log out? You'll need to sign in again to access your account.</p>
            </Modal.Body>
            <Modal.Footer>
              <button
                className="btn btn-ghost px-3 py-2 text-sm"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-error px-3 py-2 text-sm"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  toast.success('Successfully logged out', 'You have been signed out of your account');
                  window.location.href = '/auth/signin';
                }}
              >
                Logout
              </button>
            </Modal.Footer>
          </div>
        </Modal>
        <ToastContainer toasts={toasts} onRemoveToast={toast.remove} position="top-center" />
      </div>
    </div>
  );
};

export default AdminMobileLayout;
