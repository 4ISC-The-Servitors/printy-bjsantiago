import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerChatPanel from '../../components/chat/CustomerChatPanel';
import {
  type ChatMessage,
  type QuickReply,
  type ChatRole,
} from '../../components/chat/_shared/types';
import DesktopSidebar from '../../components/customer/dashboard/desktop/Sidebar';
import MobileSidebar from '../../components/customer/dashboard/mobile/Sidebar';
import DashboardContent from '../../components/customer/dashboard/desktop/DashboardContent';
import {
  ToastContainer,
  Modal,
  Text,
  Button,
  PageLoading,
} from '../../components/shared';
import { mockOrders } from '../../data/orders';
import { useToast } from '../../lib/useToast';
import { customerFlows as flows } from '../../chatLogic/customer';
import {
  ShoppingCart,
  HelpCircle,
  Clock,
  Info,
  MessageSquare,
  Settings,
  X,
} from 'lucide-react';

// TODO: Backend Integration
// - Replace mock recent order data with real data from Supabase
// - Replace mock recent ticket data with real support tickets
// - Implement real-time updates for orders and tickets
// - Add proper error handling for data fetching
// - Implement pagination for conversation history
// - Add conversation persistence to database
// - Implement real-time chat updates with Supabase subscriptions

type TopicKey =
  | 'placeOrder'
  | 'issueTicket'
  | 'trackTicket'
  | 'servicesOffered'
  | 'aboutUs'
  | 'faqs';

// ChatMessage type now imported from shared ChatPanel

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  flowId: string;
  status: 'active' | 'completed';
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
    icon: <Clock className="w-6 h-6" />,
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

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [toasts, toastMethods] = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentFlow, setCurrentFlow] = useState<{
    id: string;
    initial: (ctx: unknown) => { text: string }[];
    respond: (
      ctx: unknown,
      input: string
    ) => Promise<{ messages: { text: string }[]; quickReplies?: string[] }>;
    quickReplies: () => string[];
  } | null>(null);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [inputPlaceholder, setInputPlaceholder] = useState('Type a message...');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const handleModern = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    const handleLegacy = function (
      this: MediaQueryList,
      e: MediaQueryListEvent
    ) {
      setIsDesktop(e.matches);
    };
    setIsDesktop(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', handleModern);
    else (mql as MediaQueryList).addListener(handleLegacy);
    return () => {
      if (mql.removeEventListener)
        mql.removeEventListener('change', handleModern);
      else (mql as MediaQueryList).removeListener(handleLegacy);
    };
  }, []);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const topics = useMemo(
    () =>
      Object.entries(topicConfig) as [
        TopicKey,
        (typeof topicConfig)[TopicKey],
      ][],
    []
  );

  // TODO: Replace with real data from Supabase
  // const { data: recentOrder } = await supabase
  //   .from('orders')
  //   .select('*')
  //   .eq('user_id', userId)
  //   .order('updated_at', { ascending: false })
  //   .limit(1)
  //   .single();

  // const { data: recentTicket } = await supabase
  //   .from('tickets')
  //   .select('*')
  //   .eq('user_id', userId)
  //   .order('updated_at', { ascending: false })
  //   .limit(1)
  //   .single();

  // Mock recent order and ticket (prototype only) - REMOVE WHEN IMPLEMENTING BACKEND
  const [recentOrder, setRecentOrder] = useState(() => {
    const miguel = mockOrders.find(o => o.customer === 'Miguel Tan');
    return {
      id: miguel?.id || 'ORD-000145',
      title: miguel ? `Order for ${miguel.customer}` : 'Recent Order',
      status: 'Awaiting Payment',
      updatedAt: Date.now() - 1000 * 60 * 45,
      total: '₱5,000',
    };
  });

  const recentTicket = useMemo(
    () => ({
      id: 'TCK-000052',
      subject: 'Delivery schedule inquiry',
      status: 'Open',
      updatedAt: Date.now() - 1000 * 60 * 125, // ~2 hours ago
    }),
    []
  );

  const initializeFlow = (flowId: string, title: string, ctx?: any) => {
    const flow = flows[flowId];
    if (!flow) return;

    setCurrentFlow(
      flow as unknown as {
        id: string;
        initial: (ctx: unknown) => { text: string }[];
        respond: (
          ctx: unknown,
          input: string
        ) => Promise<{ messages: { text: string }[]; quickReplies?: string[] }>;
        quickReplies: () => string[];
      }
    );
    const initialMessages =
      (flow as any).initial?.(ctx || {}) || flow.initial({});

    // Find the topic config to get the icon
    const topicEntry = Object.entries(topicConfig).find(
      ([, config]) => config.flowId === flowId
    );
    const icon = topicEntry ? topicEntry[1].icon : undefined;

    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title,
      createdAt: Date.now(),
      messages: [],
      flowId,
      status: 'active',
      icon,
    };

    setConversations(prev => [conversation, ...prev]);
    setActiveId(conversation.id);

    // Sequentially render initial bot messages with typing indicator before each
    const msgs = initialMessages as { text: string }[];
    let index = 0;
    const renderNext = () => {
      if (index >= msgs.length) {
        // Set initial quick replies after all messages are rendered
        let rawReplies = flow.quickReplies();
        if (!rawReplies || rawReplies.length === 0) {
          rawReplies = ['End Chat'];
        }
        const replies = rawReplies.map((label: string, i: number) => ({
          id: `qr-${i}`,
          label,
          value: label,
        }));
        setQuickReplies(replies);
        updateInputPlaceholder(flowId, replies);
        setIsTyping(false);
        return;
      }
      setIsTyping(true);
      setTimeout(() => {
        const m = msgs[index++];
        const botMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'printy' as ChatRole,
          text: m.text,
          ts: Date.now(),
        };
        setMessages(prev => [...prev, botMsg]);
        setConversations(prev =>
          prev.map(c =>
            c.id === conversation.id
              ? { ...c, messages: [...c.messages, botMsg] }
              : c
          )
        );
        renderNext();
      }, 1000);
    };
    renderNext();
  };

  const updateInputPlaceholder = (flowId: string, replies: QuickReply[]) => {
    if (flowId === 'issue-ticket' && replies.length === 0) {
      setInputPlaceholder('Enter your Order ID (e.g., ORD-123456)');
    } else if (replies.length === 0) {
      setInputPlaceholder('Type a message...');
    } else {
      setInputPlaceholder('Type a message...');
    }
  };

  // Listen for Pay Now from Recent Order card to open Payment chat
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { orderId?: string };
      const orderId = detail?.orderId || recentOrder.id;
      const title = `Payment for ${orderId}`;
      initializeFlow('payment', title, { orderId, total: recentOrder.total });
    };
    window.addEventListener(
      'customer-open-payment-chat',
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        'customer-open-payment-chat',
        handler as EventListener
      );
  }, [recentOrder.id]);

  // Listen for Cancel Order button to open Cancel chat
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        orderId?: string;
        orderStatus?: string;
      };
      const orderId = detail?.orderId || recentOrder.id;
      const title = `Cancel Order ${orderId}`;
      initializeFlow('cancel-order', title, {
        orderId,
        orderStatus: detail?.orderStatus,
      });
    };
    window.addEventListener(
      'customer-open-cancel-chat',
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        'customer-open-cancel-chat',
        handler as EventListener
      );
  }, [recentOrder.id]);

  const handleTopic = (key: TopicKey) => {
    const cfg = topicConfig[key];
    initializeFlow(cfg.flowId, cfg.label);
  };

  const handleSend = async (text: string) => {
    if (!currentFlow || !activeId) return;

    // Prevent sending if conversation is completed
    const activeConversation = conversations.find(c => c.id === activeId);
    if (activeConversation?.status === 'completed') return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      ts: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setConversations(prev =>
      prev.map(c =>
        c.id === activeId ? { ...c, messages: [...c.messages, userMessage] } : c
      )
    );

    setIsTyping(true);
    setQuickReplies([]);

    try {
      const response = await currentFlow.respond({}, text);

      // Sequentially render response messages with typing indicator before each
      const msgs = (response.messages || []) as { text: string }[];
      let index = 0;
      const renderNext = () => {
        if (index >= msgs.length) {
          const rr = response.quickReplies || [];
          const rawReplies = rr.length === 0 ? ['End Chat'] : rr;
          const replies = rawReplies.map((label: string, i: number) => ({
            id: `qr-${i}`,
            label,
            value: label,
          }));
          setQuickReplies(replies);
          updateInputPlaceholder(currentFlow.id, replies);
          // If payment moved to verifying, update recentOrder status immediately
          if (
            msgs.some((m: any) =>
              String(m.text || '').includes('confirm your payment shortly')
            )
          ) {
            setRecentOrder(prev => ({ ...prev, status: 'Verifying Payment' }));
          }
          setIsTyping(false);
          return;
        }
        setIsTyping(true);
        setTimeout(() => {
          const m = msgs[index++];
          const botMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'printy' as ChatRole,
            text: m.text,
            ts: Date.now(),
          };
          setMessages(prev => [...prev, botMsg]);
          setConversations(prev =>
            prev.map(c =>
              c.id === activeId
                ? { ...c, messages: [...c.messages, botMsg] }
                : c
            )
          );
          renderNext();
        }, 600);
      };
      renderNext();
    } catch (error) {
      console.error('Flow error:', error);
      toastMethods.error(
        'Chat Error',
        'There was an issue processing your message. Please try again.'
      );
      setIsTyping(false);
    }
  };

  const handleQuickReply = (value: string) => {
    // Prevent quick replies if conversation is completed
    const activeConversation = conversations.find(c => c.id === activeId);
    if (activeConversation?.status === 'completed') return;

    const normalized = value.trim().toLowerCase();
    if (normalized === 'end chat' || normalized === 'end') {
      endChat();
      return;
    }
    handleSend(value);
  };

  const switchConversation = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (!conv) return;

    setActiveId(id);
    setMessages(conv.messages);

    // For completed conversations, don't restore interactive state
    if (conv.status === 'completed') {
      setCurrentFlow(null);
      setQuickReplies([]);
      setInputPlaceholder('This conversation has ended');
      setIsTyping(false);
    } else {
      // Restore flow state for active conversations
      const flow = flows[conv.flowId];
      if (flow) {
        setCurrentFlow(
          flow as unknown as {
            id: string;
            initial: (ctx: unknown) => { text: string }[];
            respond: (
              ctx: unknown,
              input: string
            ) => Promise<{
              messages: { text: string }[];
              quickReplies?: string[];
            }>;
            quickReplies: () => string[];
          }
        );
        const replies = flow
          .quickReplies()
          .map((label: string, index: number) => ({
            id: `qr-${index}`,
            label,
            value: label,
          }));
        setQuickReplies(replies);
        updateInputPlaceholder(conv.flowId, replies);
      }
    }
  };

  const endChat = () => {
    if (!activeId) return;

    // Check if conversation is already completed
    const currentConversation = conversations.find(c => c.id === activeId);
    if (currentConversation?.status === 'completed') return;

    // Add end chat message
    const endMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'printy' as ChatRole,
      text: 'Thank you for chatting with Printy! Have a great day. 👋',
      ts: Date.now(),
    };

    // Update messages and conversation
    setMessages(prev => [...prev, endMessage]);
    setConversations(prev =>
      prev.map(c =>
        c.id === activeId ? { ...c, messages: [...c.messages, endMessage] } : c
      )
    );

    // Clear quick replies (prevent duplicate End Chat)
    setQuickReplies([]);

    // Mark conversation as completed
    setConversations(prev =>
      prev.map(c =>
        c.id === activeId
          ? { ...c, status: 'completed' as const, icon: c.icon }
          : c
      )
    );

    // Standardized delay before closing (2 seconds)
    setTimeout(() => {
      setActiveId(null);
      setMessages([]);
      setCurrentFlow(null);
      setQuickReplies([]);
      setInputPlaceholder('Type a message...');
    }, 2000);
  };

  const handleBack = () => {
    // Just go back to dashboard without ending the conversation
    setActiveId(null);
    setMessages([]);
    setCurrentFlow(null);
    setQuickReplies([]);
    setInputPlaceholder('Type a message...');
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);

    try {
      // TODO: Implement real logout with Supabase
      // await supabase.auth.signOut();

      // TODO: Clear any local state or user data
      // setUser(null);
      // setProfile(null);

      toastMethods.success(
        'Successfully logged out',
        'You have been signed out of your account'
      );

      // Redirect to sign in page
      setTimeout(() => {
        navigate('/auth/signin');
      }, 1000);
    } catch (error) {
      console.error('Logout error:', error);
      toastMethods.error('Logout Error', 'There was an issue signing you out');
      navigate('/auth/signin');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
      <DesktopSidebar
        conversations={conversations}
        activeId={activeId}
        onSwitchConversation={switchConversation}
        onNavigateToAccount={() => navigate('/customer/account')}
        onLogout={handleLogout}
      />
      <MobileSidebar
        conversations={conversations}
        activeId={activeId}
        onSwitchConversation={switchConversation}
        onNavigateToAccount={() => navigate('/customer/account')}
        onLogout={handleLogout}
      />
      {/* Main Content - Full Screen for Chat */}
      <main className={`flex-1 flex flex-col pl-16 lg:pl-0`}>
        {isLoading ? (
          <PageLoading variant="dashboard" />
        ) : activeId ? (
          // Full screen chat without containers
          <CustomerChatPanel
            title={conversations.find(c => c.id === activeId)?.title || 'Chat'}
            messages={messages}
            onSend={handleSend}
            isTyping={isTyping}
            onBack={handleBack}
            quickReplies={quickReplies}
            onQuickReply={handleQuickReply}
            inputPlaceholder={inputPlaceholder}
            onEndChat={endChat}
            disabled={
              conversations.find(c => c.id === activeId)?.status === 'completed'
            }
          />
        ) : (
          <DashboardContent
            topics={topics}
            recentOrder={recentOrder}
            recentTicket={recentTicket}
            onTopicSelect={key => handleTopic(key as TopicKey)}
          />
        )}
      </main>

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
            <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button variant="error" onClick={confirmLogout}>
              Logout
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Container */}
      <ToastContainer
        toasts={toasts}
        onRemoveToast={toastMethods.remove}
        position={isDesktop ? 'bottom-right' : 'top-center'}
      />
    </div>
  );
};

export default CustomerDashboard;
