import { supabase } from '../../lib/supabase';
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
  const [currentFlow, setCurrentFlow] = useState<any>(null);

  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [inputPlaceholder, setInputPlaceholder] = useState('Type a message...');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Simulate data loading (UI shimmer)
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

  // ✅ Fetch the latest order for logged-in user
  useEffect(() => {
    const fetchRecentOrder = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select('order_id, order_status, order_datetime, service_id')
        .eq('customer_id', user.id) // ✅ FIXED (was user_id)
        .order('order_datetime', { ascending: false })
        .limit(1)
        .maybeSingle(); // ✅ safer than .single()

      if (error) {
        console.error('Error fetching recent order:', error.message);
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
    };

    fetchRecentOrder();
  }, []);

  // ✅ Fetch the latest ticket for logged-in user
  useEffect(() => {
    const fetchRecentTicket = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('inquiries')
        .select('inquiry_id, inquiry_message, inquiry_status, received_at')
        .eq('customer_id', user.id) // ✅ FIXED (was user_id)
        .order('received_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching recent ticket:', error.message);
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
    };

    fetchRecentTicket();
  }, []);

  // ---------------- Chat Logic ----------------
  const initializeFlow = (flowId: string, title: string) => {
    const flow = flows[flowId];
    if (!flow) return;

    setCurrentFlow(flow);
    const initialMessages = flow.initial({});
    const botMessages: ChatMessage[] = initialMessages.map((msg: { text: string }) => ({
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

    const replies = flow.quickReplies().map((label: string, index: number) => ({
      id: `qr-${index}`,
      label,
      value: label,
    }));
    setQuickReplies(replies);
    updateInputPlaceholder(flowId, replies);
  };

  const updateInputPlaceholder = (flowId: string, replies: QuickReply[]) => {
    if (flowId === 'issue-ticket' && replies.length === 0) {
      setInputPlaceholder('Enter your Order ID (e.g., ORD-123456)');
    } else {
      setInputPlaceholder('Type a message...');
    }
  };

  const handleTopic = (key: TopicKey) => {
    const cfg = topicConfig[key];
    initializeFlow(cfg.flowId, cfg.label);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
      <DesktopSidebar
        conversations={conversations}
        activeId={activeId}
        onSwitchConversation={id => setActiveId(id)}
        onNavigateToAccount={() => navigate('/customer/account')}
        onLogout={() => setShowLogoutModal(true)}
      />

      <MobileSidebar
        conversations={conversations}
        activeId={activeId}
        onSwitchConversation={id => setActiveId(id)}
        onNavigateToAccount={() => navigate('/customer/account')}
        onLogout={() => setShowLogoutModal(true)}
      />

      <main className="flex-1 flex flex-col pl-16 lg:pl-0">
        {isLoading ? (
          <PageLoading variant="dashboard" />
        ) : activeId ? (
          <CustomerChatPanel
            title={conversations.find(c => c.id === activeId)?.title || 'Chat'}
            messages={messages}
            onSend={() => {}}
            isTyping={isTyping}
            onBack={() => {}}
            quickReplies={quickReplies}
            onQuickReply={() => {}}
            inputPlaceholder={inputPlaceholder}
            onEndChat={() => {}}
            disabled={conversations.find(c => c.id === activeId)?.status === 'completed'}
          />
        ) : (
          <DashboardContent
            topics={topics}
            recentOrder={recentOrder}
            recentTicket={recentTicket} // ✅ won’t crash if null
            onTopicSelect={key => handleTopic(key as TopicKey)}
          />
        )}
      </main>

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



  