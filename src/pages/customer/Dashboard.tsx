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
import { ToastContainer, Text, PageLoading, useToast } from '../../components/shared';
import { ShoppingCart, HelpCircle, TicketIcon, Info, MessageSquare, Settings } from 'lucide-react';
// ChatFlow type not used directly after hook migration
// In-memory flow registry and DB-backed chat flow API helpers
// legacy imports removed
// Incremental adoption of composed conversations hook (DB + scripted)
import { useCustomerConversations } from '../../features/chat/customer/hooks/useCustomerConversations';

// ---------------- Types / Config ----------------
type TopicKey =
  | 'placeOrder'
  | 'issueTicket'
  | 'trackTicket'
  | 'servicesOffered'
  | 'aboutUs'
  | 'faqs';

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  flowId: string;
  status: 'active' | 'ended';
  icon?: React.ReactNode;
}

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
    description: 'Get a custom quote for printing services',
  },
  issueTicket: {
    label: 'Issue a Ticket',
    icon: <HelpCircle className="w-6 h-6" />,
    flowId: 'issue-ticket',
    description: 'Report an issue with an existing order',
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

// Use full customer flows registry

// ---------------- Component ----------------
// Customer landing experience: shows recent activity and provides chat entrypoints.
// Manages two chat implementations:
// 1) In-memory scripted flows (e.g., payment, cancel-order)
// 2) Database-backed flow for 'About Us' using chat_flow tables
const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [toasts, toastMethods] = useToast();

  // Phase 2 (incremental): use hook just for send/quick-reply/end handlers
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

  // Chat conversation state now provided by useCustomerConversations

  // Current active flow (legacy; will be removed after full hook migration)

  // Quick replies and placeholder now supplied by the hook
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);

  // Database-backed state for About Us flow (handled by hook now)

  // Live recent order/ticket from Supabase
  const [recentOrder, setRecentOrder] = useState<{
    id: string;
    title: string;
    status: string;
    updatedAt: number;
    total?: string;
  } | null>(null);

  const [recentTicket, setRecentTicket] = useState<{
    id: string;
    subject: string;
    status: string;
    updatedAt: number;
  } | null>(null);

  // Initial loading shimmer for dashboard visuals
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Topics grid now rendered via ChatCards; explicit topics array no longer needed

  // ---------------- Supabase fetches ----------------
  // Load most recent order/ticket to show on the dashboard cards
  useEffect(() => {
    const fetchRecentOrder = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('orders')
          .select(`
            order_id, 
            order_status, 
            order_datetime, 
            service_id,
            specification,
            page_size,
            quantity,
            quotes:quotes(initial_price, negotiated_price)
          `)
          .eq('customer_id', user.id)
          .order('order_datetime', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching recent order:', error);
          return;
        }

        if (data) {
          // Calculate total from quotes
          let total: string | undefined = undefined;
          if (data.quotes && data.quotes.length > 0) {
            const quote = data.quotes[0];
            const quotedPrice = quote.negotiated_price || quote.initial_price;
            if (quotedPrice) {
              total = `₱${quotedPrice.toFixed(2)}`;
            }
          }

          setRecentOrder({
            id: data.order_id,
            title: data.service_id || 'Unknown Service',
            status: data.order_status || 'unknown',
            updatedAt: new Date(data.order_datetime).getTime(),
            total,
          });
        }
      } catch (e) {
        console.error('fetchRecentOrder error', e);
      }
    };

    const fetchRecentTicket = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('inquiries')
          .select('inquiry_id, inquiry_message, inquiry_status, received_at')
          .eq('customer_id', user.id)
          .order('received_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching recent ticket:', error);
          return;
        }

        if (data) {
          setRecentTicket({
            id: data.inquiry_id,
            subject: data.inquiry_message || '(no subject)',
            status: data.inquiry_status || 'unknown',
            updatedAt: new Date(data.received_at).getTime(),
          });
        }
      } catch (e) {
        console.error('fetchRecentTicket error', e);
      }
    };

    fetchRecentOrder();
    fetchRecentTicket();
  }, []);

  // Load recent chat sessions from database for the sidebar list
  useEffect(() => {
    const loadRecentSessions = async () => {
      try {
        const { data: sessions, error } = await supabase
          .from('chat_sessions')
          .select(`
            session_id,
            customer_id,
            status,
            created_at,
            chat_session_flow!inner(
              flow_id,
              chat_flows!inner(title)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching sessions:', error);
          return;
        }

        if (sessions && sessions.length > 0) {
          const sessionConversations: Conversation[] = sessions.map((session: any) => ({
            id: session.session_id,
            title: session.chat_session_flow?.chat_flows?.title || 'Chat',
            createdAt: new Date(session.created_at).getTime(),
            messages: [], // Messages will be loaded when switching to conversation
            flowId: session.chat_session_flow?.flow_id || 'about',
            status: session.status === 'ended' ? 'ended' : 'active',
            icon: undefined,
          }));

          setConversations(prev => {
            // Merge with existing conversations, avoiding duplicates
            const existingIds = new Set(prev.map(c => c.id));
            const newConversations = sessionConversations.filter(c => !existingIds.has(c.id));
            return [...newConversations, ...prev].sort((a, b) => b.createdAt - a.createdAt);
          });
        }
      } catch (e) {
        console.error('loadRecentSessions error', e);
      }
    };

    loadRecentSessions();
  }, []);

  // DB-backed About Us init now handled by useCustomerConversations

  // DB-backed About Us send now handled by useCustomerConversations

  // ---------------- Chat logic ----------------
  // Initialize flow via useCustomerConversations
  const initializeFlow = (flowId: string, title: string, ctx: unknown = {}) => {
    initializeFlowHook(flowId, title, ctx);
  };

  // Listen for Cancel Order button from RecentOrder card to open Cancel chat
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        orderId?: string;
        orderStatus?: string;
      };
      const orderId = detail?.orderId || recentOrder?.id;
      const title = `Cancel Order ${orderId ?? ''}`;
      initializeFlow('cancel-order', title, {
        orderId,
        orderStatus: detail?.orderStatus,
      });
    };
    window.addEventListener('customer-open-cancel-chat', handler as EventListener);
    return () => window.removeEventListener('customer-open-cancel-chat', handler as EventListener);
  }, [recentOrder?.id]);

  // Listen for Pay Now button from RecentOrder card to open Payment chat
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        orderId?: string;
        total?: string;
      };
      const orderId = detail?.orderId || recentOrder?.id;
      const title = `Payment for Order ${orderId ?? ''}`;
      initializeFlow('payment', title, {
        orderId,
        total: detail?.total,
      });
    };
    window.addEventListener('customer-open-payment-chat', handler as EventListener);
    return () => window.removeEventListener('customer-open-payment-chat', handler as EventListener);
  }, [recentOrder?.id]);

  // Listen for external request to open a specific session (from Chat History)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { sessionId: string };
      const sessionId = detail?.sessionId;
      if (!sessionId) return;
      switchConversationHook(sessionId);
    };
    window.addEventListener('customer-open-session', handler as EventListener);
    return () => window.removeEventListener('customer-open-session', handler as EventListener);
  }, [conversations]);

  // Placeholder logic handled by the hook

  // Central user input is handled by useCustomerConversations now

  // Quick replies handled via useCustomerConversations (wired above)

  // End chat handled via useCustomerConversations (wired above)

  // Conversation switching handled by hook

  // Handle file attachments from the input area: create URL and route through handler
  const handleAttachFiles = (files: FileList) => {
    const f = files?.[0];
    if (f) {
      const url = URL.createObjectURL(f);
      // Send the image URL so it renders in chat and triggers payment flow detection
      sendViaHook(url);
    }
  };

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
            <LogoutButton onClick={() => {
              setShowLogoutModal(true);
            }} />
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
            readOnly={conversations.find(c => c.id === activeId)?.status === 'ended'}
            hideInput={conversations.find(c => c.id === activeId)?.status === 'ended'}
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
          try {
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error('Logout error:', error);
              toastMethods.error('Logout Error', 'Failed to log out. Please try again.');
              return;
            }
            
            // Show success toast and wait a bit before redirecting
            toastMethods.success('Logged Out', 'You have been successfully logged out.');
            setShowLogoutModal(false);
            
            // Wait for toast to show before redirecting
            setTimeout(() => {
              navigate('/auth/signin');
            }, 1500);
          } catch (error) {
            console.error('Logout error:', error);
            toastMethods.error('Logout Error', 'An unexpected error occurred. Please try again.');
          }
        }}
      />

      <ToastContainer 
        toasts={toasts} 
        onRemoveToast={id => toastMethods.remove(id)} 
        position="bottom-right"
      />
    </div>
  );
};

export default CustomerDashboard;