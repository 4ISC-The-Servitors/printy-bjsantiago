import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Text, Button, ToastContainer } from '@admin/components/shared';
import { SpecEditorModal } from '../../quotes/SpecEditorModal';
import { X } from 'lucide-react';
import { useDeviceUtils } from '@shared/hooks/ui';
import { useToast } from '@lib/useToast';
import { useAdminChat } from '@admin/hooks/useAdminChat';
import { useChatAttachments } from '@features/chat/hooks/shared/useChatAttachments';
import { useTicketImageUpload } from '@features/chat/hooks/admin/useTicketImageUpload';
import type { NavRoute } from '../navigation';
import { useCallback } from 'react';
import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';
import {
  AdminChatDock,
  AdminChatOverlay,
} from '@features/chat/components/layouts';
import { supabase } from '@lib/supabase';

export interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Main admin layout switcher
 * Renders DesktopLayout or MobileLayout based on viewport
 * Manages chat state, navigation, and logout
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { isMobileOrTablet } = useDeviceUtils();
  const navigate = useNavigate();
  const [toasts, toast] = useToast();
  const [uploadPct, setUploadPct] = useState<number | null>(null);
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
    handleShowConversation,
    handleSendMessage,
    handleQuickReply,
    endChatWithDelay,
    readOnly,
    dbSessionId,
    currentConversationId,
  } = useAdminChat();

  // Handle file attachments for admin chat
  const { handleAttachFiles } = useChatAttachments(handleSendMessage);
  const { handleTicketImageUpload } = useTicketImageUpload();

  // Enhanced file upload handler that uses ticket image upload for ticket review flows
  const handleFileUpload = useCallback(
    async (files: FileList) => {
      console.log('[Admin handleFileUpload] Starting upload:', {
        filesCount: files.length,
        dbSessionId,
      });

      // Check if we're in admin-review-ticket flow
      if (dbSessionId) {
        // Fetch session metadata to check flow_id and get inquiry_id
        const { data: sessionData } = await supabase
          .from('chat_sessions_v2')
          .select('flow_id, metadata')
          .eq('session_id', dbSessionId)
          .single();

        console.log('[Admin handleFileUpload] Session data:', {
          flowId: sessionData?.flow_id,
          hasInquiryId: !!sessionData?.metadata?.context?.inquiry_id,
          hasCustomerId: !!sessionData?.metadata?.context?.customer_id,
        });

        if (
          sessionData?.flow_id === 'admin-review-ticket' &&
          sessionData?.metadata?.context?.inquiry_id
        ) {
          const inquiryId = sessionData.metadata.context.inquiry_id;
          const customerId = sessionData.metadata.context.customer_id;

          if (inquiryId && customerId) {
            console.log(
              '[Admin handleFileUpload] Admin-review-ticket detected, uploading to ticket-uploads bucket'
            );
            // Use ticket file upload for ticket review flows
            setUploadPct(0);
            await handleTicketImageUpload(
              files,
              inquiryId,
              customerId,
              urls => {
                if (urls && urls.length > 0) {
                  console.log(
                    '[Admin handleFileUpload] Upload successful, sending URLs in one message'
                  );
                  handleSendMessage(urls.join('\n'));
                }
                setTimeout(() => setUploadPct(null), 400);
              },
              errors => {
                if (errors && errors.length > 0) {
                  console.error(
                    '[Admin handleFileUpload] Upload errors:',
                    errors
                  );
                  // Show toast only; DO NOT send a chat message so the flow does not advance
                  toast.error('Upload failed', errors.join('; '));
                }
                setTimeout(() => setUploadPct(null), 400);
              },
              pct => setUploadPct(pct)
            );
            return;
          } else {
            console.error(
              '[Admin handleFileUpload] Missing inquiryId or customerId'
            );
          }
        }
      }

      // Use regular chat attachments for other flows
      console.log(
        '[Admin handleFileUpload] Using regular chat attachments (blob URL)'
      );
      handleAttachFiles(files);
    },
    [dbSessionId, handleTicketImageUpload, handleSendMessage, handleAttachFiles]
  );

  // Listen for admin-chat-open custom events from ticket cards
  useEffect(() => {
    const handleAdminChatOpen = (event: CustomEvent) => {
      const { topic, orderId, updateOrder, orders, refreshOrders, orderIds } =
        event.detail;

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

    const handleAdminShowConversation = (event: CustomEvent) => {
      const { conversationId } = event.detail;

      // Call the handleShowConversation function to view historical chat
      handleShowConversation(conversationId);
    };

    // Add event listeners for admin chat events
    window.addEventListener(
      'admin-chat-open',
      handleAdminChatOpen as EventListener
    );
    window.addEventListener(
      'admin-show-conversation',
      handleAdminShowConversation as EventListener
    );

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener(
        'admin-chat-open',
        handleAdminChatOpen as EventListener
      );
      window.removeEventListener(
        'admin-show-conversation',
        handleAdminShowConversation as EventListener
      );
    };
  }, [handleChatOpenWithTopic, handleShowConversation]);

  // Check for signin success toast
  useEffect(() => {
    if (sessionStorage.getItem('signin-success') === 'true') {
      sessionStorage.removeItem('signin-success');
      toast.success('Welcome back!', 'Successfully signed in');
    }
  }, [toast]);

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
    try {
      // CRITICAL: Always call supabase.auth.signOut() to clear session
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error);
        toast.error('Logout failed', 'Please try again');
        return;
      }

      // Clear any local storage related to user session
      localStorage.removeItem('user');

      setShowLogoutModal(false);

      // Store logout success flag for signin page to show toast
      sessionStorage.setItem('logout-success', 'true');

      // Navigate immediately - toast will show on signin page
      navigate('/auth/signin', { replace: true });
    } catch (err) {
      console.error('Unexpected logout error:', err);
      toast.error('Logout failed', 'An unexpected error occurred');
    }
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
    <div className="relative" style={{ minHeight: '100vh' }}>
      {isMobileOrTablet ? (
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
              onAttachFiles={handleFileUpload}
              readOnly={readOnly}
              toast={[toasts, toast]}
              sessionId={dbSessionId || undefined}
              conversationId={currentConversationId || undefined}
              uploadProgressPct={uploadPct}
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
              onToggle={() => {
                setChatOpen(false);
                // Dispatch event for notification visibility
                window.dispatchEvent(new CustomEvent('admin-chat-closed'));
              }}
              title="Printy Assistant"
              messages={messages}
              isTyping={isTyping}
              quickReplies={quickReplies}
              onSend={handleSendMessage}
              onQuickReply={handleQuickReply}
              onEndChat={endChatWithDelay}
              onAttachFiles={handleFileUpload}
              readOnly={readOnly}
              sessionId={dbSessionId || undefined}
              conversationId={currentConversationId || undefined}
              toast={[toasts, toast]}
              uploadProgressPct={uploadPct}
            />
          }
        >
          {children}
        </DesktopLayout>
      )}

      {/* Spec Editor Modal */}
      <SpecEditorModal />

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
        position={isMobileOrTablet ? 'top-center' : 'bottom-right'}
      />

      {/* Progress overlay is rendered inside AdminChatDock/AdminChatOverlay to avoid duplicates */}
    </div>
  );
};

export default AdminLayout;
