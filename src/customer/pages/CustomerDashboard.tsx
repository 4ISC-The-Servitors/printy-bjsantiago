// Supabase client for auth and database queries
import { supabase } from '@lib/supabase';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Customer chat UI and types
import {
  CustomerChatPanel,
  CustomerChatOverlay,
} from '@features/chat/components/layouts';
// Sidebar and dashboard widgets
import ResponsivePageLayout from '@customer/components/shared/layouts/ResponsivePageLayout';
import SidebarPanel from '@customer/components/shared/sidebar/SidebarPanel';
import LogoutButton from '@customer/components/shared/sidebar/LogoutButton';
import LogoutModal from '@customer/components/shared/sidebar/LogoutModal';
import DashboardGrid from '@customer/components/dashboard/DashboardGrid';
import ChatCards from '@customer/components/dashboard/chatCards/ChatCards';
import RecentCard from '@customer/components/dashboard/RecentCard';
// Shared UI components
import { ToastContainer, Text } from '@shared/components';
import Notification from '@shared/components/feedback/Notification';
// Loading states
import { CustomerDashboardLoading } from '@customer/components/loadingStates';
import { useLogoutWithToast } from '@/auth/hooks/useLogoutWithToast';
import { useRecentOrder } from '@customer/hooks/useRecentOrder';
import { useRecentTicket } from '@customer/hooks/useRecentTicket';
import { useRecentQuote } from '@customer/hooks/useRecentQuote';
import { useRecentChatSessions } from '@features/chat/hooks/customer/useRecentChatSessions';
import { useDashboardChatEvents } from '@features/chat/hooks/customer/useDashboardChatEvents';
import { useChatAttachments } from '@features/chat/hooks/shared/useChatAttachments';
import { usePaymentProofUpload } from '@/features/chat/hooks/customer/usePaymentProofUpload';
import { useDeviceUtils } from '@shared/hooks/ui';
// Chat feature hooks
import { CustomerConversationsProvider, useCustomerConversationsContext } from '@features/chat/hooks/customer/CustomerConversationsProvider';
import { getSessionTitle } from '@features/chat/config/sessionTitleConfig';

// ---------------- Types / Config ----------------
import {
  ShoppingCart,
  HelpCircle,
  Info,
  MessageSquare,
  Settings,
  Calculator,
} from 'lucide-react';
type TopicKey =
  | 'placeOrder'
  | 'askQuote'
  | 'issueTicket'
  | 'servicesOffered'
  | 'aboutUs'
  | 'faqs';

const topicConfig: Record<
  TopicKey,
  { label: string; icon: React.ReactNode; flowId: string; description: string }
> = {
  servicesOffered: {
    label: 'Services Offered',
    icon: <Settings className="w-6 h-6" />,
    flowId: 'services-offered',
    description: 'Browse our printing services and capabilities',
  },
  placeOrder: {
    label: 'Place an Order',
    icon: <ShoppingCart className="w-6 h-6" />,
    flowId: 'place-order',
    description: "Avail B.J. Santiago's printing services",
  },
  askQuote: {
    label: 'Ask Quote',
    icon: <Calculator className="w-6 h-6" />,
    flowId: 'ask-quote',
    description: 'Get a personalized quote for your printing needs',
  },
  issueTicket: {
    label: 'Ask Assistance',
    icon: <HelpCircle className="w-6 h-6" />,
    flowId: 'issue-ticket',
    description:
      'Ask for a quote before ordering or report an issue with an existing order',
  },
  aboutUs: {
    label: 'About Us',
    icon: <Info className="w-6 h-6" />,
    flowId: 'about-us',
    description: 'Learn about B.J. Santiago Inc.',
  },
  faqs: {
    label: 'FAQs',
    icon: <MessageSquare className="w-6 h-6" />,
    flowId: 'faqs',
    description: 'Quick answers to common questions',
  },
};

// topicConfig now imported from feature config

// Use full customer flows registry

// ---------------- Component ----------------
// Inner component that uses the context
const CustomerDashboardContent: React.FC = () => {
  const { logout, toasts, toast } = useLogoutWithToast();
  const { isMobileOrTablet } = useDeviceUtils();
  const [showLogoutModal, setShowLogoutModal] = useState(false);


  // ✅ Use context instead of hook directly (prevents duplicate instances)
  const {
    messages,
    isTyping,
    conversations,
    activeId,
    quickReplies,
    handleSend: sendViaHook,
    handleQuickReply: quickReplyViaHook,
    endChat: endChatViaHook,
    initializeFlow: initializeFlowHook,
    switchConversation: switchConversationHook,
    setActiveId,
    setConversations,
  } = useCustomerConversationsContext();

  // Memoize toast instance to prevent re-creating array on every render
  const toastInstance = useMemo(
    () => [toasts, toast] as [any, any],
    [toasts, toast]
  );

  // Remove artificial timers; rely on data-fetch loading states

  // Live recent order/ticket/quote from Supabase
  const { data: recentOrder, loading: loadingRecentOrder } = useRecentOrder();
  const { data: recentTicket, loading: loadingRecentTicket } =
    useRecentTicket();

  // Get current user for recent quote
  const [customerId, setCustomerId] = useState<string | undefined>();
  useEffect(() => {
    const getCustomerId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCustomerId(user?.id);
    };
    getCustomerId();
  }, []);

  // Check for pending session ID from localStorage and open conversation
  useEffect(() => {
    const pendingSessionId = localStorage.getItem('pendingSessionId');

    if (pendingSessionId && switchConversationHook) {

      // Check if conversation exists in current list
      const existingConversation = conversations.find(
        c => c.id === pendingSessionId
      );

      if (existingConversation) {
        // Clear the pending session ID
        localStorage.removeItem('pendingSessionId');
        // Switch to the conversation
        switchConversationHook(pendingSessionId);
      } else if (conversations.length > 0) {
        // Conversations have loaded but the specific one isn't found
        localStorage.removeItem('pendingSessionId');
      } else {
        // Don't clear the pending session ID yet, wait for conversations to load
        // The effect will run again when conversations.length changes
      }
    }
  }, [switchConversationHook, conversations.length, conversations]);

  const { data: recentQuote, loading: loadingRecentQuote } =
    useRecentQuote(customerId);
  useRecentChatSessions(setConversations);

  // Check for signin success toast
  useEffect(() => {
    if (sessionStorage.getItem('signin-success') === 'true') {
      sessionStorage.removeItem('signin-success');
      toast.success('Welcome back!', 'Successfully signed in');
    }
  }, [toast]);

  // Determine loading based on data hooks
  const isLoading =
    loadingRecentOrder || loadingRecentTicket || loadingRecentQuote;

  // NOTE: Session loading is handled by useRecentChatSessions hook
  // No need to manually load sessions here

  // ---------------- Chat logic ----------------
  // Initialize flow via useCustomerConversations
  const initializeFlow = (flowId: string, title: string, ctx: unknown = {}) => {
    initializeFlowHook(flowId, title, ctx);
  };

  useDashboardChatEvents(
    initializeFlow,
    switchConversationHook,
    () => recentOrder?.id,
    () => recentOrder?.total
  );

  // Attachments
  const { handleAttachFiles } = useChatAttachments(sendViaHook);
  const { handlePaymentProofUpload } = usePaymentProofUpload();

  // Check if current conversation is a payment flow
  // Matches: "Pay Order", "Payment", "Reupload Payment", etc.
  const activeConversation = conversations.find(c => c.id === activeId);
  const isPaymentFlow =
    activeId &&
    activeConversation &&
    (activeConversation.title?.toLowerCase().includes('payment') ||
      activeConversation.title?.toLowerCase().includes('pay'));

  // Enhanced file upload handler that uses payment proof upload for payment flows
  const handleFileUpload = useCallback(
    async (files: FileList) => {

      if (isPaymentFlow && activeConversation) {
        // Get order ID from payment flow context or fallback to recent order
        let orderId = recentOrder?.id;

        // Try to get order ID from payment flow context if available
        if (activeConversation.context?.orderId) {
          orderId = activeConversation.context.orderId;
        }


        if (orderId) {
          // Use payment proof upload for payment flows
          await handlePaymentProofUpload(
            files,
            orderId,
            url => {
              // Send the uploaded file URL to the chat
              sendViaHook(url);
            },
            error => {
              // Handle error - could show a toast or error message
              console.error('Payment proof upload failed:', error);
              sendViaHook(`Upload failed: ${error}`);
            }
          );
        } else {
          console.error('No order ID available for payment proof upload');
          sendViaHook('Error: No order ID available. Please try again.');
        }
      } else {
        // Use regular chat attachments for other flows
        handleAttachFiles(files);
      }
    },
    [
      isPaymentFlow,
      activeConversation,
      recentOrder?.id,
      handlePaymentProofUpload,
      sendViaHook,
      handleAttachFiles,
    ]
  );

  const handleTopic = (key: TopicKey) => {
    const cfg = topicConfig[key];
    // Use centralized title configuration from FLOW_TITLES mapping
    const title = getSessionTitle({
      flowId: cfg.flowId,
    });
    initializeFlow(cfg.flowId, title);
    // Dispatch event for notification visibility
    window.dispatchEvent(new CustomEvent('customer-chat-opened'));
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout('/auth/signin');
  };

  // ---------------- UI ----------------
  const dashboardContent = (
    <>
      {/* Notification Bell - Fixed Position for dashboard only */}
      <Notification />
      {isLoading ? (
        <CustomerDashboardLoading />
      ) : activeId ? (
        <>
          {/* Desktop/Laptop chat panel */}
          <div className="hidden lg:block h-full">
            <CustomerChatPanel
              title={
                conversations.find(c => c.id === activeId)?.title || 'Chat'
              }
              messages={messages}
              onSend={sendViaHook}
              isTyping={isTyping}
              onBack={() => {
                setActiveId(null);
                window.dispatchEvent(new CustomEvent('customer-chat-closed'));
              }}
              onMinimize={() => {
                setActiveId(null);
                window.dispatchEvent(new CustomEvent('customer-chat-closed'));
              }}
              quickReplies={quickReplies}
              onQuickReply={quickReplyViaHook}
              onEndChat={endChatViaHook}
              onAttachFiles={handleFileUpload}
              readOnly={
                conversations.find(c => c.id === activeId)?.status === 'ended'
              }
              hideInput={
                conversations.find(c => c.id === activeId)?.status === 'ended'
              }
              toast={toastInstance}
              sessionId={activeId}
              conversationId={activeId}
            />
          </div>

          {/* Mobile/Tablet chat overlay */}
          <div className="lg:hidden">
            <CustomerChatOverlay
              open={!!activeId}
              onClose={() => setActiveId(null)}
              title={
                conversations.find(c => c.id === activeId)?.title || 'Chat'
              }
              messages={messages}
              isTyping={isTyping}
              quickReplies={quickReplies}
              onSend={sendViaHook}
              onQuickReply={quickReplyViaHook}
              onEndChat={endChatViaHook}
              readOnly={
                conversations.find(c => c.id === activeId)?.status === 'ended'
              }
              sessionId={activeId}
              conversationId={activeId}
              toast={toastInstance}
            />
          </div>
        </>
      ) : (
        <div className="w-full">
          <div className="text-center space-y-1 mb-6 sm:mb-8">
            <Text
              variant="h1"
              className="device-text-heading text-brand-primary"
              size="xl"
              weight="extrabold"
            >
              How can I help you today?
            </Text>
            <Text variant="p" className="device-text-body text-neutral-600">
              Check recent activity or start a new chat
            </Text>
          </div>

          <DashboardGrid
            recentCard={
              <RecentCard
                orderData={recentOrder}
                ticketData={recentTicket}
                quoteData={recentQuote}
                onTopicSelect={key => handleTopic(key as TopicKey)}
              />
            }
            chatCards={
              <ChatCards
                onSelect={(key: string) => handleTopic(key as TopicKey)}
              />
            }
          />
        </div>
      )}
    </>
  );

  // When chat is active, render without ResponsivePageLayout to avoid extra containers
  if (activeId) {
    return (
      <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
        {/* Desktop Sidebar (>= lg) */}
        <aside className="hidden lg:flex w-64 xl:w-80 bg-white border-r border-neutral-200 flex-col">
          <SidebarPanel
            conversations={conversations}
            activeId={activeId}
            onSwitchConversation={id => {
              setActiveId(id);
              window.dispatchEvent(
                new CustomEvent('customer-open-session', {
                  detail: { sessionId: id },
                })
              );
            }}
            onNavigateToAccount={() => {
              window.location.href = '/customer/account';
            }}
            bottomActions={<LogoutButton onClick={handleLogout} />}
          />
        </aside>

        {/* Main Content Area - Chat Panel/Overlay */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {isMobileOrTablet ? (
            <CustomerChatOverlay
              open={!!activeId}
              onClose={() => setActiveId(null)}
              title={
                conversations.find(c => c.id === activeId)?.title || 'Chat'
              }
              messages={messages}
              isTyping={isTyping}
              quickReplies={quickReplies}
              onSend={sendViaHook}
              onQuickReply={quickReplyViaHook}
              onEndChat={endChatViaHook}
              readOnly={
                conversations.find(c => c.id === activeId)?.status === 'ended'
              }
              sessionId={activeId}
              conversationId={activeId}
              toast={toastInstance}
            />
          ) : (
            <CustomerChatPanel
              title={
                conversations.find(c => c.id === activeId)?.title || 'Chat'
              }
              messages={messages}
              onSend={sendViaHook}
              isTyping={isTyping}
              onBack={() => {
                setActiveId(null);
                window.dispatchEvent(new CustomEvent('customer-chat-closed'));
              }}
              onMinimize={() => {
                setActiveId(null);
                window.dispatchEvent(new CustomEvent('customer-chat-closed'));
              }}
              quickReplies={quickReplies}
              onQuickReply={quickReplyViaHook}
              onEndChat={endChatViaHook}
              onAttachFiles={handleFileUpload}
              readOnly={
                conversations.find(c => c.id === activeId)?.status === 'ended'
              }
              hideInput={
                conversations.find(c => c.id === activeId)?.status === 'ended'
              }
              toast={toastInstance}
              sessionId={activeId}
              conversationId={activeId}
            />
          )}
        </main>

        <ToastContainer
          toasts={toasts}
          onRemoveToast={id => toast.remove(id)}
          position={isMobileOrTablet ? 'top-center' : 'bottom-right'}
        />

        {/* Logout Modal */}
        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={confirmLogout}
        />
      </div>
    );
  }

  // Normal dashboard view with ResponsivePageLayout
  return (
    <>
      <ResponsivePageLayout showSidebar={true}>
        {dashboardContent}
      </ResponsivePageLayout>

      <ToastContainer
        toasts={toasts}
        onRemoveToast={id => toast.remove(id)}
        position={isMobileOrTablet ? 'top-center' : 'bottom-right'}
      />

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
};

// Main component wrapped with provider
const CustomerDashboard: React.FC = () => {
  return (
    <CustomerConversationsProvider>
      <CustomerDashboardContent />
    </CustomerConversationsProvider>
  );
};

export default CustomerDashboard;
