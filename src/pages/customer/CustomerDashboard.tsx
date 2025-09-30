// Supabase client for auth and database queries
import { supabase } from '../../lib/supabase';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Customer chat UI and types
import ChatPanel from '../../components/customer/chatPanel/ChatPanel';
import type { ChatMessage } from '../../components/chat/_shared/types';
// Sidebar and dashboard widgets
import SidebarPanel from '../../components/customer/shared/sidebar/SidebarPanel';
import LogoutButton from '../../components/customer/shared/sidebar/LogoutButton';
import LogoutModal from '../../components/customer/shared/sidebar/LogoutModal';
import ChatCards from '../../components/customer/dashboard/chatCards/ChatCards';
import RecentOrder from '../../components/customer/dashboard/recentOrders/RecentOrder';
import RecentTickets from '../../components/customer/dashboard/recentTickets/RecentTickets';
// Shared UI components
import { ToastContainer, Text, PageLoading } from '../../components/shared';
import { useLogoutWithToast } from '../../features/toast/hooks/useLogoutWithToast';
import { useRecentOrder } from '../../features/chat/customer/hooks/useRecentOrder';
import { useRecentTicket } from '../../features/chat/customer/hooks/useRecentTicket';
import { useRecentChatSessions } from '../../features/chat/customer/hooks/useRecentChatSessions';
import { useDashboardChatEvents } from '../../features/chat/customer/hooks/useDashboardChatEvents';
import { useChatAttachments } from '../../features/chat/core/hooks/useChatAttachments';
// Chat feature hooks
import { useCustomerConversations } from '../../features/chat/customer/hooks/useCustomerConversations';

// ---------------- Types / Config ----------------
import {
  ShoppingCart,
  HelpCircle,
  TicketIcon,
  Info,
  MessageSquare,
  Settings,
} from 'lucide-react';
type TopicKey =
  | 'placeOrder'
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

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  flowId: string;
  status: 'active' | 'ended';
  icon?: React.ReactNode;
}

// topicConfig now imported from feature config

// Use full customer flows registry

// ---------------- Component ----------------
// Customer landing experience: shows recent activity and provides chat entrypoints.
// Manages two chat implementations:
// 1) In-memory scripted flows (e.g., payment, cancel-order)
// 2) Database-backed flow for 'About Us' using chat_flow tables
const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, toasts, toast } = useLogoutWithToast();

  const {
    messages,
    isTyping,
    conversations,
    activeId,
    quickReplies,
    inputPlaceholder,
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

  const [isLoading, setIsLoading] = useState(true);

  // Live recent order/ticket from Supabase
  const { data: recentOrder } = useRecentOrder();
  const { data: recentTicket } = useRecentTicket();
  useRecentChatSessions(setConversations);

  // Initial loading shimmer for dashboard visuals
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

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

  const handleTopic = (key: TopicKey) => {
    const cfg = topicConfig[key];
    initializeFlow(cfg.flowId, cfg.label);
  };

  // ---------------- UI ----------------
  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-neutral-200">
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
      </aside>

      <main className="flex-1 flex flex-col pl-16 lg:pl-0">
        {isLoading ? (
          <PageLoading variant="dashboard" />
        ) : activeId ? (
          <ChatPanel
            title={conversations.find(c => c.id === activeId)?.title || 'Chat'}
            messages={messages}
            onSend={sendViaHook}
            isTyping={isTyping}
            onBack={() => setActiveId(null)}
            quickReplies={quickReplies}
            onQuickReply={quickReplyViaHook}
            inputPlaceholder={inputPlaceholder}
            onEndChat={endChatViaHook}
            onAttachFiles={handleAttachFiles}
            readOnly={
              conversations.find(c => c.id === activeId)?.status === 'ended'
            }
            hideInput={
              conversations.find(c => c.id === activeId)?.status === 'ended'
            }
          />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <RecentOrder
                  recentOrder={
                    recentOrder ?? {
                      id: '—',
                      title: 'No recent order',
                      status: 'none',
                      updatedAt: Date.now(),
                    }
                  }
                />
                <RecentTickets
                  recentTicket={
                    recentTicket ?? {
                      id: '—',
                      subject: 'No recent ticket',
                      status: 'none',
                      updatedAt: Date.now(),
                    }
                  }
                />
              </div>
              <ChatCards onSelect={key => handleTopic(key as TopicKey)} />
            </div>
          </div>
        )}
      </main>

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
        position="bottom-right"
      />
    </div>
  );
};

export default CustomerDashboard;
