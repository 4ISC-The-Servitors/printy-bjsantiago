import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Text } from '../../components/shared';
import ChatPanel, { type ChatMessage, type QuickReply, type ChatRole } from '../../components/chat/ChatPanel';
import { customerFlows as flows } from '../../chatLogic/customer';
import {
  Bot,
  Menu,
  X,
  ShoppingCart,
  HelpCircle,
  Clock,
  Info,
  MessageSquare,
  Settings,
  LogOut,
  User,

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      setInputPlaceholder('Type your response...');
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50">
      {/* Top bar for mobile */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-200">
        <Container className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-primary text-white flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <Text variant="h3" size="lg" weight="bold" className="text-brand-primary">
              Printy
            </Text>
          </div>
          <Button
            variant="ghost"
            size="sm"
            threeD
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setSidebarOpen((s) => !s)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </Container>
      </div>

      <div className="max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-0">
        {/* Sidebar */}
        <aside
          className={
            sidebarOpen
              ? 'fixed inset-0 z-50 bg-black/20 lg:static lg:bg-transparent'
              : 'lg:static'
          }
        >
          <div
            className={
              'absolute left-0 top-0 h-full w-72 max-w-[260px] bg-white border-r border-neutral-200 transition-transform lg:translate-x-0 flex flex-col ' +
              (sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')
            }
          >
            <div className="p-4 shrink-0">
              <div className="hidden lg:flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-brand-primary text-white flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <Text variant="h3" size="lg" weight="bold" className="text-brand-primary">
                    Printy
                  </Text>
                  <Text variant="p" size="xs" color="muted">
                    B.J. Santiago Inc.
                  </Text>
                </div>
              </div>
            </div>

            {/* Scrollable Chats Section */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-4">
              {conversations.length > 0 && (
                <div className="mb-4">
                  <Text variant="h3" size="sm" weight="semibold" className="px-1 pb-2 text-neutral-600">
                    Chats
                  </Text>
                  <div className="space-y-2">
                    {conversations.map((c) => {
                      const lastBotMessage = [...c.messages].reverse().find(m => m.role === 'printy');
                      
                      return (
                        <button
                          key={c.id}
                          onClick={() => switchConversation(c.id)}
                          className={
                            'w-full text-left rounded-lg border px-3 py-3 transition-colors ' +
                            (c.id === activeId
                              ? 'bg-brand-primary-50 border-brand-primary'
                              : 'bg-white border-neutral-200 hover:bg-neutral-50')
                          }
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-md bg-brand-primary text-white flex items-center justify-center text-xs mt-0.5">
                              <Bot className="w-3 h-3" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Text variant="h4" size="sm" weight="semibold" className="truncate">
                                  {c.title}
                                </Text>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  c.status === 'active' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-neutral-100 text-neutral-600'
                                }`}>
                                  {c.status === 'active' ? 'Active' : 'Completed'}
                                </span>
                              </div>
                              <Text variant="p" size="xs" color="muted" className="truncate">
                                {lastBotMessage?.text.substring(0, 60) || 'No messages yet'}
                                {(lastBotMessage?.text.length || 0) > 60 ? '...' : ''}
                              </Text>
                              <Text variant="p" size="xs" color="muted" className="mt-1">
                                {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Sidebar Section */}
            <div className="p-4 border-t border-neutral-200 shrink-0">
              <div className="space-y-4">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  threeD
                  onClick={() => navigate('/account')}
                >
                  <User className="w-4 h-4 mr-2" /> Account
                </Button>
                <Button
                  variant="accent"
                  className="w-full justify-start"
                  threeD
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
              </div>
            </div>
          </div>
          {sidebarOpen && (
            <div className="h-full" onClick={() => setSidebarOpen(false)} />
          )}
        </aside>

        {/* Main */}
        <main className="p-4 lg:p-8 flex-1">
          <div className="h-full w-full">
            {!activeId ? (
              <>
                <div className="text-center space-y-2 mb-8">
                  <Text variant="h1" size="4xl" weight="bold" className="text-brand-primary">
                    How can I help you today?
                  </Text>
                  <Text variant="p" color="muted">
                    Choose a topic below or start a new chat
                  </Text>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                  {topics.map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handleTopic(key)}
                      className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-neutral-200 hover:border-brand-primary/20 hover:-translate-y-1 text-left"
                    >
                      <div className="w-12 h-12 rounded-lg bg-brand-accent-50 text-brand-accent flex items-center justify-center mb-4 group-hover:bg-brand-accent group-hover:text-white transition-colors">
                        {cfg.icon}
                      </div>
                      <Text variant="h3" size="xl" weight="semibold" className="mb-2">
                        {cfg.label}
                      </Text>
                      <Text variant="p" size="sm" color="muted">
                        {cfg.description}
                      </Text>
                    </button>
                  ))}
                </div>

                {/* Mock recent activity cards (prototype only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Order */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <Text variant="h3" size="lg" weight="semibold" className="mb-4">
                      Recent Order
                    </Text>
                    <div className="space-y-2">
                      <Text variant="p" size="sm" className="font-semibold">{recentOrder.title}</Text>
                      <Text variant="p" size="sm" color="muted">Order #{recentOrder.id}</Text>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-info-50 text-info">{recentOrder.status}</span>
                        <Text variant="p" size="xs" color="muted">{new Date(recentOrder.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      </div>
                    </div>
                  </div>

                  {/* Recent Ticket */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <Text variant="h3" size="lg" weight="semibold" className="mb-4">
                      Recent Ticket
                    </Text>
                    <div className="space-y-2">
                      <Text variant="p" size="sm" className="font-semibold">{recentTicket.subject}</Text>
                      <Text variant="p" size="sm" color="muted">Ticket #{recentTicket.id}</Text>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-warning-50 text-warning">{recentTicket.status}</span>
                        <Text variant="p" size="xs" color="muted">{new Date(recentTicket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex">
                {/* Enhanced Chat panel */}
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
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerDashboard;


