import React from 'react';
import { Button, Text } from '../../../shared';
import Modal from '../../../shared/Modal';
import ToastContainer from '../../../shared/ToastContainer';
import { useToast } from '../../../../lib/useToast';
import RecentChats from '../RecentChats';
import { X, Settings, LogOut } from 'lucide-react';
import useAdminNav from '@hooks/admin/useAdminNav';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  onSettingsClick,
  onLogoutClick,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [toasts, toast] = useToast({ position: 'top-center', duration: 2500 });
  const { go } = useAdminNav();
  const handleSelectChat = (id: string) => {
    // Ensure we open existing conversation on mobile and close the sidebar
    window.dispatchEvent(
      new CustomEvent('admin-chat-open', { detail: { conversationId: id } })
    );
    onClose();
  };

  const handleLogoutPress = () => {
    if (onLogoutClick) {
      onLogoutClick();
      return;
    }
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    toast.success('Successfully logged out', 'You have been signed out of your account');
    window.location.href = '/auth/signin';
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out w-64 shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4">
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Body layout: scrollable recent chats + fixed bottom actions */}
        <div className="flex flex-col h-[calc(100%-56px)]">
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* Recent Chats section */}
            <div className="flex items-center justify-between px-1">
              <Text variant="h3" size="sm" weight="semibold" className="text-neutral-700">
                Recent Chats
              </Text>
              <Button
                variant="ghost"
                size="sm"
                className="text-neutral-500 hover:text-neutral-700 h-8 px-2"
                onClick={() => {
                  onClose();
                  go('chats');
                }}
              >
                View all
              </Button>
            </div>
            <div className="mt-2 border-t border-neutral-200" />
            <RecentChats onSelect={handleSelectChat} limit={4} showHeader={false} className="mb-3" />
          </div>
          <div className="border-t border-neutral-200 p-4 mb-5 space-y-3">
            <Button
              onClick={onSettingsClick}
              variant="secondary"
              className="w-full justify-start px-3 py-2"
              threeD
            >
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
            <Button
              onClick={handleLogoutPress}
              variant="error"
              className="w-full justify-start px-3 py-2"
              threeD
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
        <Modal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} size="sm">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between p-6 pb-4">
              <Text variant="h3" size="lg" weight="semibold">
                Confirm Logout
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogoutConfirm(false)}
                className="ml-4 h-8 w-8 p-0 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="px-6 pb-4">
              <Text variant="p">
                Are you sure you want to log out? You'll need to sign in again to
                access your account.
              </Text>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 pt-4">
              <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </Button>
              <Button variant="error" threeD onClick={confirmLogout}>
                Logout
              </Button>
            </div>
          </div>
        </Modal>
      </div>
      <ToastContainer toasts={toasts} onRemoveToast={toast.remove} position="top-center" />
    </>
  );
};

export default MobileSidebar;
