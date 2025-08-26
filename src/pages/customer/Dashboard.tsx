import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatPanel, { type ChatMessage, type QuickReply, type ChatRole } from '../../components/chat/ChatPanel';
import MobileSidebar from '../../components/customer/MobileSidebar';
import DesktopSidebar from '../../components/customer/DesktopSidebar';
import DashboardContent from '../../components/customer/DashboardContent';
import { customerFlows as flows } from '../../chatLogic/customer';
import {
  ShoppingCart,
  HelpCircle,
  Clock,
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

// ChatMessage type now imported from shared ChatPanel

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  flowId: string;
  status: 'active' | 'completed';
}

const topicConfig: Record<
  TopicKey,
  { label: string; icon: React.ReactNode; flowId: string; description: string }
> = {
  servicesOffered: {
    label: 'Services Offered',
    icon: <Settings className="w-6 h-6" />,
    flowId: 'services',
    description: 'Browse our printing services and capabilities'
  },
  placeOrder: {
    label: 'Place an Order',
    icon: <ShoppingCart className="w-6 h-6" />,
    flowId: 'place-order',
    description: 'Get a custom quote for printing services'
  },
  issueTicket: {
    label: 'Issue a Ticket',
    icon: <HelpCircle className="w-6 h-6" />,
    flowId: 'issue-ticket',
    description: 'Report an issue with an existing order'
  },
  trackTicket: {
    label: 'Track a Ticket',
    icon: <Clock className="w-6 h-6" />,
    flowId: 'track-ticket',
    description: 'Check the status of your orders'
  },
  aboutUs: {
    label: 'About Us',
    icon: <Info className="w-6 h-6" />,
    flowId: 'about',
    description: 'Learn about B.J. Santiago Inc.'
  },
  faqs: {
    label: 'FAQs',
    icon: <MessageSquare className="w-6 h-6" />,
    flowId: 'faqs',
    description: 'Quick answers to common questions'
  },
};

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentFlow, setCurrentFlow] = useState<any>(null);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [inputPlaceholder, setInputPlaceholder] = useState('Type a message...');

  const topics = useMemo(() => Object.entries(topicConfig) as [TopicKey, typeof topicConfig[TopicKey]][], []);

  // Mock recent order and ticket (prototype only)
  const recentOrder = useMemo(() => ({
    id: 'ORD-000145',
    title: 'Business Cards · Digital Printing',
    status: 'In Progress',
    updatedAt: Date.now() - 1000 * 60 * 45, // 45 mins ago
  }), []);

  const recentTicket = useMemo(() => ({
    id: 'TCK-000052',
    subject: 'Delivery schedule inquiry',
    status: 'Open',
    updatedAt: Date.now() - 1000 * 60 * 125, // ~2 hours ago
  }), []);

  const initializeFlow = (flowId: string, title: string) => {
    const flow = flows[flowId];
    if (!flow) return;

    setCurrentFlow(flow);
    const initialMessages = flow.initial({});
    const botMessages: ChatMessage[] = initialMessages.map((msg: any) => ({
      id: crypto.randomUUID(),
      role: 'printy' as ChatRole,
      text: msg.text,
      ts: Date.now(),
    }));

    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title,
      createdAt: Date.now(),
      messages: botMessages,
      flowId,
      status: 'active',
    };

    setConversations((prev) => [conversation, ...prev]);
    setActiveId(conversation.id);
    setMessages(botMessages);

    // Set initial quick replies
    const replies = flow.quickReplies().map((label: string) => ({ label, value: label }));
    setQuickReplies(replies);
    updateInputPlaceholder(flowId, replies);
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

  const handleTopic = (key: TopicKey) => {
    const cfg = topicConfig[key];
    initializeFlow(cfg.flowId, cfg.label);
  };

  const handleSend = async (text: string) => {
    if (!currentFlow || !activeId) return;

    const userMessage: ChatMessage = { 
      id: crypto.randomUUID(), 
      role: 'user', 
      text, 
      ts: Date.now() 
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setConversations((prev) => 
      prev.map((c) => 
        c.id === activeId ? { ...c, messages: [...c.messages, userMessage] } : c
      )
    );

    setIsTyping(true);
    setQuickReplies([]);

    try {
      const response = await currentFlow.respond({}, text);
      
      setTimeout(() => {
        const botMessages: ChatMessage[] = response.messages.map((msg: any) => ({
          id: crypto.randomUUID(),
          role: 'printy' as ChatRole,
          text: msg.text,
          ts: Date.now(),
        }));

        setMessages((prev) => [...prev, ...botMessages]);
        setConversations((prev) => 
          prev.map((c) => 
            c.id === activeId ? { ...c, messages: [...c.messages, ...botMessages] } : c
          )
        );

        // Update quick replies
        const replies = (response.quickReplies || []).map((label: string) => ({ label, value: label }));
        setQuickReplies(replies);
        updateInputPlaceholder(currentFlow.id, replies);
        
        setIsTyping(false);
      }, 800);
    } catch (error) {
      console.error('Flow error:', error);
      setIsTyping(false);
    }
  };

  const handleQuickReply = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'end chat' || normalized === 'end') {
      endChat();
      return;
    }
    handleSend(value);
  };

  const switchConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    
    setActiveId(id);
    setMessages(conv.messages);
    
    // Restore flow state
    const flow = flows[conv.flowId];
    if (flow) {
      setCurrentFlow(flow);
      const replies = flow.quickReplies().map((label: string) => ({ label, value: label }));
      setQuickReplies(replies);
      updateInputPlaceholder(conv.flowId, replies);
    }
  };

  const endChat = () => {
    if (!activeId) return;
    
    // Add end chat message
    const endMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'printy' as ChatRole,
      text: 'Thank you for chatting with Printy! Have a great day. 👋',
      ts: Date.now(),
    };
    
    // Update messages and conversation
    setMessages((prev) => [...prev, endMessage]);
    setConversations((prev) => 
      prev.map((c) => 
        c.id === activeId ? { ...c, messages: [...c.messages, endMessage] } : c
      )
    );
    
    // Clear quick replies (prevent duplicate End Chat)
    setQuickReplies([]);
    
    // Mark conversation as completed
    setConversations((prev) => 
      prev.map((c) => 
        c.id === activeId ? { ...c, status: 'completed' as const } : c
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
    endChat();
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('prototype_role');
      localStorage.removeItem('prototype_email');
    } catch {}
    navigate('/auth/signin');
  };

  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
      <MobileSidebar
        conversations={conversations}
        activeId={activeId}
        onSwitchConversation={switchConversation}
        onNavigateToAccount={() => navigate('/account')}
        onLogout={handleLogout}
      />
      
      <DesktopSidebar
        conversations={conversations}
        activeId={activeId}
        onSwitchConversation={switchConversation}
        onNavigateToAccount={() => navigate('/account')}
        onLogout={handleLogout}
      />

      {/* Main Content - Full Screen for Chat */}
      <main className={`flex-1 flex flex-col ${activeId ? 'pl-16' : 'pl-16'} lg:pl-0`}>
        {activeId ? (
          // Full screen chat without containers
          <ChatPanel
            title={conversations.find((c) => c.id === activeId)?.title || 'Chat'}
            messages={messages}
            onSend={handleSend}
            isTyping={isTyping}
            onBack={handleBack}
            quickReplies={quickReplies}
            onQuickReply={handleQuickReply}
            inputPlaceholder={inputPlaceholder}
            onEndChat={endChat}
          />
        ) : (
          <DashboardContent
            topics={topics}
            recentOrder={recentOrder}
            recentTicket={recentTicket}
            onTopicSelect={(key) => handleTopic(key as TopicKey)}
          />
        )}
      </main>
    </div>
  );
};

export default CustomerDashboard;


