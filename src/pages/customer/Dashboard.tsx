import { supabase } from '../../lib/supabase';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatPanel from '../../components/customer/chatPanel/ChatPanel';
import type { ChatMessage, QuickReply, ChatRole } from '../../components/chat/_shared/types';
import SidebarPanel from '../../components/customer/shared/sidebar/SidebarPanel';
import ChatCards from '../../components/customer/dashboard/chatCards/ChatCards';
import RecentOrder from '../../components/customer/dashboard/recentOrders/RecentOrder';
import RecentTickets from '../../components/customer/dashboard/recentTickets/RecentTickets';
import { ToastContainer, Text, PageLoading, Modal, Button, useToast } from '../../components/shared';
import { ShoppingCart, HelpCircle, TicketIcon, Info, MessageSquare, Settings, X } from 'lucide-react';
import type { ChatFlow } from '../../types/chatFlow';
import { customerFlows as flows } from '../../chatLogic/customer';

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
const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [toasts, toastMethods] = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Current active flow
  const [currentFlow, setCurrentFlow] = useState<ChatFlow | null>(null);

  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [inputPlaceholder, setInputPlaceholder] = useState('Type a message...');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Live recent order/ticket from Supabase
  const [recentOrder, setRecentOrder] = useState<{
    id: string;
    title: string;
    status: string;
    updatedAt: number;
  } | null>(null);

  const [recentTicket, setRecentTicket] = useState<{
    id: string;
    subject: string;
    status: string;
    updatedAt: number;
  } | null>(null);

  // loading shimmer
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Topics grid now rendered via ChatCards; explicit topics array no longer needed

  // ---------------- Supabase fetches ----------------
  useEffect(() => {
    const fetchRecentOrder = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('orders')
          .select('order_id, order_status, order_datetime, service_id')
          .eq('customer_id', user.id)
          .order('order_datetime', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching recent order:', error);
          return;
        }

        if (data) {
          setRecentOrder({
            id: data.order_id,
            title: data.service_id || 'Unknown Service',
            status: data.order_status || 'unknown',
            updatedAt: new Date(data.order_datetime).getTime(),
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

  // ---------------- Chat logic ----------------
  const initializeFlow = (flowId: string, title: string, ctx: unknown = {}) => {
    const flow = flows[flowId];
    if (!flow) {
      console.warn('Flow not found:', flowId);
      return;
    }

    setCurrentFlow(flow);
    console.debug('[FLOW_INIT]', flowId, flow);

    const initialMessages = flow.initial(ctx as any);
    const botMessages: ChatMessage[] = initialMessages.map(msg => ({
      id: crypto.randomUUID(),
      role: 'printy' as ChatRole,
      text: msg.text,
      ts: Date.now(),
    }));

    const topicEntry = Object.entries(topicConfig).find(
      ([, config]) => config.flowId === flowId
    );
    const icon = topicEntry ? topicEntry[1].icon : undefined;

    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title,
      createdAt: Date.now(),
      messages: botMessages,
      flowId,
      status: 'active',
      icon,
    };

    setConversations(prev => [conversation, ...prev]);
    setActiveId(conversation.id);
    setMessages(botMessages);

    const replies: QuickReply[] = flow
      .quickReplies()
      .map((label: string, index: number) => ({ id: `qr-${index}`, label, value: label }));
    setQuickReplies(replies);
    updateInputPlaceholder(flowId, replies);
  };

  // Listen for Cancel Order button to open Cancel chat
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

  const updateInputPlaceholder = (flowId: string, replies: QuickReply[]) => {
    if (flowId === 'issue-ticket' && replies.length === 0) {
      setInputPlaceholder('Enter your Order ID (e.g., ORD-123456)');
    } else {
      setInputPlaceholder('Type a message...');
    }
  };

  // central user input handler (works for typed send and quick replies)
  const handleUserInput = async (text: string) => {
    if (!currentFlow || !activeId) return;

    console.debug('[FLOW_SEND]', currentFlow.id, text);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      ts: Date.now(),
    };

    // add to UI messages and conversation
    setMessages(prev => [...prev, userMsg]);
    setConversations(prev =>
      prev.map(c => (c.id === activeId ? { ...c, messages: [...c.messages, userMsg] } : c))
    );

    setIsTyping(true);
    setQuickReplies([]);

    try {
      const result = await currentFlow.respond({}, text);
      console.debug('[FLOW_RESP]', result);

      const botMessages: ChatMessage[] = result.messages.map(msg => ({
        id: crypto.randomUUID(),
        role: 'printy' as ChatRole,
        text: msg.text,
        ts: Date.now(),
      }));

      setTimeout(() => {
        // append bot messages to UI and to conversation
        setMessages(prev => [...prev, ...botMessages]);
        setConversations(prev =>
          prev.map(c => (c.id === activeId ? { ...c, messages: [...c.messages, ...botMessages] } : c))
        );

        // update quick replies from flow result
        const replies = (result.quickReplies || []).map((label: string, index: number) => ({
          id: `qr-${index}`,
          label,
          value: label,
        }));
        setQuickReplies(replies);

        // update input placeholder using currentFlow.id (safe because typed)
        if (currentFlow) updateInputPlaceholder(currentFlow.id, replies);

        setIsTyping(false);
      }, 800);
    } catch (err) {
      console.error('Flow error:', err);
      setIsTyping(false);
      toastMethods.error('Chat Error', 'There was an issue processing your message. Please try again.');
    }
  };

  // quick replies come from the CustomerChatPanel as strings — forward to the user input handler
  const handleQuickReply = (value: string) => {
    // defensive: if the user clicked something that ends the chat
    const normalized = (value ?? '').trim().toLowerCase();
    if (normalized === 'end chat' || normalized === 'end') {
      handleEndChat();
      return;
    }
    handleUserInput(value);
  };

  const handleEndChat = () => {
    if (!activeId) return;
    setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, status: 'ended' } : c)));
    setActiveId(null);
    setMessages([]);
    setQuickReplies([]);
    setCurrentFlow(null);
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
          onSwitchConversation={id => setActiveId(id)}
          onNavigateToAccount={() => navigate('/customer/account')}
          bottomActions={
            <Button variant="accent" onClick={() => setShowLogoutModal(true)}>
              Logout
            </Button>
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
            onSend={handleUserInput}
            isTyping={isTyping}
            onBack={() => setActiveId(null)}
            quickReplies={quickReplies}
            onQuickReply={handleQuickReply}
            inputPlaceholder={inputPlaceholder}
            onEndChat={handleEndChat}
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
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        size="sm"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Text variant="h2">Confirm Logout</Text>
            <button
              onClick={() => setShowLogoutModal(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <Text>Are you sure you want to log out of your account?</Text>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="secondary"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemoveToast={id => toastMethods.remove(id)} />
    </div>
  );
};

export default CustomerDashboard;









  