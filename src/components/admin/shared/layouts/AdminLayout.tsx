import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Text, Button, ToastContainer } from '../../../shared';
import { X } from 'lucide-react';
import { useIsMobile } from '../../../../hooks/ui/useIsMobile';
import { useToast } from '../../../../lib/useToast';
import { useAdminChat } from '../../../../hooks/admin/useAdminChat';
import { useAdminConversations } from '../../../../hooks/admin/useAdminConversations';
import { useAdminRecentChatSessions } from '../../../../hooks/admin/useAdminRecentChatSessions';
import type { NavRoute } from '../navigation';
import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';
import { AdminChatDock, AdminChatOverlay } from '../../../chat/layouts';

export interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Main admin layout switcher
 * Renders DesktopLayout or MobileLayout based on viewport
 * Manages chat state, navigation, and logout
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [toasts, toast] = useToast();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Use existing admin chat hook
  const {
    chatOpen,
    setChatOpen,
    messages,
    isTyping,
    quickReplies,
    handleChatOpen,
    handleChatOpenWithTopic,
    handleSendMessage,
    handleQuickReply,
    endChatWithDelay,
    readOnly,
  } = useAdminChat();

  // Load recent chat sessions from database
  const { setConversations } = useAdminConversations();
  useAdminRecentChatSessions(setConversations);

  // Listen for admin-chat-open custom events from ticket cards
  useEffect(() => {
    const handleAdminChatOpen = (event: CustomEvent) => {
      const { topic, orderId, updateOrder, orders, refreshOrders, orderIds } = event.detail;
      
      // Call the existing handleChatOpenWithTopic function with ticket context
      handleChatOpenWithTopic(
        topic,
        orderId,
        updateOrder,
        orders,
        refreshOrders,
        orderIds
      );
    };

    // Add event listener for admin-chat-open custom events
    window.addEventListener('admin-chat-open', handleAdminChatOpen as EventListener);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('admin-chat-open', handleAdminChatOpen as EventListener);
    };
  }, [handleChatOpenWithTopic]);

  const handleNavigate = (route: NavRoute) => {
    const routes = {
      dashboard: '/admin',
      orders: '/admin/orders',
      tickets: '/admin/tickets',
      quotes: '/admin/quotes',
      portfolio: '/admin/portfolio',
    };
    navigate(routes[route]);
  };

  const handleSettings = () => {
    navigate('/admin/settings');
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleViewAllChats = () => {
    navigate('/admin/chats');
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    toast.success('Successfully logged out', 'You have been signed out');
    setTimeout(() => navigate('/auth/signin'), 1000);
  };

  const commonProps = {
    onNavigate: handleNavigate,
    onOpenChat: () => {
      if (!chatOpen) handleChatOpen();
      setChatOpen(true);
    },
    onSettings: handleSettings,
    onLogout: handleLogout,
    onViewAllChats: handleViewAllChats,
  };

  return (
    <>
      {isMobile ? (
        <MobileLayout
          {...commonProps}
          chatOverlay={
            <AdminChatOverlay
              open={chatOpen}
              onClose={endChatWithDelay}
              messages={messages}
              isTyping={isTyping}
              quickReplies={quickReplies}
              onSend={handleSendMessage}
              onQuickReply={handleQuickReply}
              onEndChat={endChatWithDelay}
              readOnly={readOnly}
            />
          }
        >
          {children}
        </MobileLayout>
      ) : (
        <DesktopLayout
          {...commonProps}
          chatDock={
            <AdminChatDock
              open={chatOpen}
              onToggle={() => setChatOpen(false)}
              title="Printy Assistant"
              messages={messages}
              isTyping={isTyping}
              quickReplies={quickReplies}
              onSend={handleSendMessage}
              onQuickReply={handleQuickReply}
              onEndChat={endChatWithDelay}
              readOnly={readOnly}
            />
          }
        >
          {children}
        </DesktopLayout>
      )}

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        size="sm"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200">
          <div className="flex items-center justify-between p-6 pb-4">
            <Text variant="h3" size="lg" weight="semibold">
              Confirm Logout
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogoutModal(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-6 pb-4">
            <Text variant="p">
              Are you sure you want to log out? You'll need to sign in again.
            </Text>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 pt-4">
            <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button variant="error" onClick={confirmLogout}>
              Logout
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onRemoveToast={toast.remove}
        position="bottom-right"
      />
    </>
  );
};

export default AdminLayout;
