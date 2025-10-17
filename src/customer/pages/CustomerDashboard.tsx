// Supabase client for auth and database queries
import { supabase } from '@lib/supabase';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Customer chat UI and types
import { CustomerChatPanel } from '@features/chat/components/layouts';
import type { ConversationItem } from '@features/chat/hooks/shared/useConversationState';
// Sidebar and dashboard widgets
import SidebarPanel from '@customer/components/shared/sidebar/SidebarPanel';
import LogoutButton from '@customer/components/shared/sidebar/LogoutButton';
import LogoutModal from '@customer/components/shared/sidebar/LogoutModal';
import ChatCards from '@customer/components/dashboard/chatCards/ChatCards';
import RecentOrder from '@customer/components/dashboard/recentOrders/RecentOrder';
import RecentTickets from '@customer/components/dashboard/recentTickets/RecentTickets';
import RecentQuotes from '@customer/components/dashboard/recentQuotes/RecentQuotes';
// Shared UI components
import { ToastContainer, Text, PageLoading, Notification } from '@shared/components';
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
import { useCustomerConversations } from '@features/chat/hooks/customer/useCustomerConversations';

// ---------------- Types / Config ----------------
import {
  ShoppingCart,
  HelpCircle,
  TicketIcon,
  Info,
  MessageSquare,
  Settings,
  Calculator,
} from 'lucide-react';
type TopicKey =
  | 'placeOrder'
  | 'askQuote'
  | 'issueTicket'
  | 'trackTicket'
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
    flowId: 'services',
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
    label: 'Ask Quote or Assistance',
    icon: <HelpCircle className="w-6 h-6" />,
    flowId: 'issue-ticket',
    description:
      'Ask for a quote before ordering or report an issue with an existing order',
  },
  trackTicket: {
    label: 'Track a Ticket',
    icon: <TicketIcon className="w-6 h-6" />,
    flowId: 'track-ticket',
    description: 'Check the status of your tickets',
  },
  aboutUs: {
    label: 'About Us',
    icon: <Info className="w-6 h-6" />,
    flowId: 'about',
    description: 'Learn about B.J. Santiago Inc.',
  },
  faqs: {
    label: 'FAQs',
    icon: <MessageSquare className="w-6 h-6" />,
    flowId: 'faqs',
    description: 'Quick answers to common questions',
  },
};

type Conversation = ConversationItem;

// topicConfig now imported from feature config

// Use full customer flows registry

// ---------------- Component ----------------
// Customer landing experience: shows recent activity and provides chat entrypoints.
// Manages two chat implementations:
// 1) In-memory scripted flows (e.g., payment)
// 2) Database-backed flow for 'About Us' using chat_flow tables
const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, toasts, toast } = useLogoutWithToast();
  const { isMobileOrTablet } = useDeviceUtils();

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
  } = useCustomerConversations();

  // Chat conversation state/actions provided by useCustomerConversations
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Remove artificial timers; rely on data-fetch loading states

  // Live recent order/ticket/quote from Supabase
  const { data: recentOrder, loading: loadingRecentOrder } = useRecentOrder();
  const { data: recentTicket, loading: loadingRecentTicket } = useRecentTicket();
  
  // Get current user for recent quote
  const [customerId, setCustomerId] = useState<string | undefined>();
  useEffect(() => {
    const getCustomerId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCustomerId(user?.id);
    };
    getCustomerId();
  }, []);
  
  const { data: recentQuote, loading: loadingRecentQuote } = useRecentQuote(customerId);
  useRecentChatSessions(setConversations);

  // Check for signin success toast
  useEffect(() => {
    if (sessionStorage.getItem('signin-success') === 'true') {
      sessionStorage.removeItem('signin-success');
      toast.success('Welcome back!', 'Successfully signed in');
    }
  }, [toast]);

  // Determine loading based on data hooks
  const isLoading = loadingRecentOrder || loadingRecentTicket || loadingRecentQuote;

  // Load recent chat sessions from database for the sidebar list (initial)
  useEffect(() => {
    const loadRecentSessions = async () => {
      try {
        const { data: sessions, error } = await supabase
          .from('chat_sessions')
          .select(
            `
            session_id,
            customer_id,
            status,
            created_at,
            chat_session_flow!inner(
              flow_id,
              chat_flows!inner(title)
            )
          `
          )
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching sessions:', error);
          return;
        }

        if (sessions && sessions.length > 0) {
          const sessionConversations: Conversation[] = sessions.map(
            (session: any) => ({
              id: session.session_id,
              title: session.chat_session_flow?.chat_flows?.title || 'Chat',
              createdAt: new Date(session.created_at).getTime(),
              messages: [], // Messages will be loaded when switching to conversation
              flowId: session.chat_session_flow?.flow_id || 'about',
              status: session.status === 'ended' ? 'ended' : 'active',
              icon: undefined,
            })
          );

          setConversations(prev => {
            // Merge with existing conversations, avoiding duplicates
            const existingIds = new Set(prev.map(c => c.id));
            const newConversations = sessionConversations.filter(
              c => !existingIds.has(c.id)
            );
            return [...newConversations, ...prev].sort(
              (a, b) => b.createdAt - a.createdAt
            );
          });
        }
      } catch (e) {
        console.error('loadRecentSessions error', e);
      }
    };

    loadRecentSessions();
  }, []);

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
  const isPaymentFlow = activeId && conversations.find(c => c.id === activeId)?.title?.toLowerCase().includes('payment');

  // Enhanced file upload handler that uses payment proof upload for payment flows
  const handleFileUpload = useCallback(async (files: FileList) => {
    console.log('File upload triggered:', files);
    console.log('Is payment flow:', isPaymentFlow);
    console.log('Recent order ID:', recentOrder?.id);
    console.log('Active conversation:', conversations.find(c => c.id === activeId));
    
    if (isPaymentFlow) {
      // Get order ID from payment flow context or fallback to recent order
      let orderId = recentOrder?.id;
      
      // Try to get order ID from payment flow context if available
      const activeConversation = conversations.find(c => c.id === activeId);
      if (activeConversation?.context?.orderId) {
        orderId = activeConversation.context.orderId;
      }
      
      console.log('Using order ID:', orderId);
      
      if (orderId) {
        // Use payment proof upload for payment flows
        console.log('Starting payment proof upload...');
        await handlePaymentProofUpload(files, orderId, (url) => {
          // Send the uploaded file URL to the chat
          console.log('Upload successful, sending URL to chat:', url);
          sendViaHook(url);
        }, (error) => {
          // Handle error - could show a toast or error message
          console.error('Payment proof upload failed:', error);
          sendViaHook(`Upload failed: ${error}`);
        });
      } else {
        console.error('No order ID available for payment proof upload');
        sendViaHook('Error: No order ID available. Please try again.');
      }
    } else {
      // Use regular chat attachments for other flows
      console.log('Using regular chat attachments');
      handleAttachFiles(files);
    }
  }, [isPaymentFlow, recentOrder?.id, conversations, activeId, handlePaymentProofUpload, sendViaHook, handleAttachFiles]);

  const handleTopic = (key: TopicKey) => {
    const cfg = topicConfig[key];
    initializeFlow(cfg.flowId, cfg.label);
  };

  // ---------------- UI ----------------
  const sidebar = (
    <SidebarPanel
      conversations={conversations}
      activeId={activeId}
      onSwitchConversation={switchConversationHook}
      onNavigateToAccount={() => navigate('/customer/account')}
      bottomActions={
        <LogoutButton
          onClick={() => {
            setShowLogoutModal(true);
          }}
        />
      }
    />
  );

  const content = (
    <>
      {isLoading ? (
        <PageLoading variant="dashboard" />
      ) : activeId ? (
        <div className="h-full">
          <CustomerChatPanel
            title={conversations.find(c => c.id === activeId)?.title || 'Chat'}
            messages={messages}
            onSend={sendViaHook}
            isTyping={isTyping}
            onBack={() => setActiveId(null)}
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
          />
        </div>
      ) : (
        <div className="p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full">
            <div className="text-center space-y-1 mb-8">
              <Text
                variant="h1"
                size="4xl"
                weight="bold"
                className="text-brand-primary"
              >
                How can I help you today?
              </Text>
              <Text variant="p" size="base" color="muted">
                Check recent activity or start a new chat
              </Text>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              <RecentOrder
                recentOrder={
                  recentOrder ?? {
                    id: '—',
                    displayId: 'NO-ORDER',
                    title: 'No recent order',
                    status: 'none',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                  }
                }
              />
              <RecentTickets
                recentTicket={
                  recentTicket ?? {
                    id: '—',
                    displayId: 'NO-TICKET',
                    subject: 'No recent ticket',
                    status: 'none',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                  }
                }
              />
              <RecentQuotes
                recentQuote={
                  recentQuote ?? {
                    id: '—',
                    displayId: 'NO-QUOTE',
                    status: 'active',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                  }
                }
              />
            </div>
            <ChatCards onSelect={key => handleTopic(key as TopicKey)} />
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Notification Bell - Fixed Position */}
      <Notification />
      
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
          {/* Sidebar (desktop) */}
          <aside className="w-64 bg-white border-r border-neutral-200">
            {sidebar}
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col">
            {content}
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
          {/* Compact left rail (mobile) */}
          <div className="fixed left-0 top-0 bottom-0 w-16 bg-white border-r border-neutral-200 z-50">
            {sidebar}
          </div>

          {/* Main content with left offset for rail */}
          <main className="flex-1 flex flex-col pl-16 h-full w-full">
            {content}
          </main>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => {
          setShowLogoutModal(false);
        }}
        onConfirm={async () => {
          setShowLogoutModal(false);
          await logout('/auth/signin', 1500);
        }}
      />

      <ToastContainer
        toasts={toasts}
        onRemoveToast={id => toast.remove(id)}
        position={isMobileOrTablet ? 'top-center' : 'bottom-right'}
      />
    </>
  );
};

export default CustomerDashboard;
