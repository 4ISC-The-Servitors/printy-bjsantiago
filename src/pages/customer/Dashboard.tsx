import { supabase } from '../../lib/supabase';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatPanel from '../../components/customer/chatPanel/ChatPanel';
import type { ChatMessage, QuickReply, ChatRole } from '../../components/chat/_shared/types';
import SidebarPanel from '../../components/customer/shared/sidebar/SidebarPanel';
import LogoutButton from '../../components/customer/shared/sidebar/LogoutButton';
import LogoutModal from '../../components/customer/shared/sidebar/LogoutModal';
import ChatCards from '../../components/customer/dashboard/chatCards/ChatCards';
import RecentOrder from '../../components/customer/dashboard/recentOrders/RecentOrder';
import RecentTickets from '../../components/customer/dashboard/recentTickets/RecentTickets';
import { ToastContainer, Text, PageLoading, useToast } from '../../components/shared';
import { ShoppingCart, HelpCircle, TicketIcon, Info, MessageSquare, Settings } from 'lucide-react';
import type { ChatFlow } from '../../types/chatFlow';
import { customerFlows as flows } from '../../chatLogic/customer';
import {
  attachSessionToFlow,
  createSession,
  fetchCurrentNode,
  fetchInitialNode,
  fetchOptions,
  fetchSessionMessages,
  insertMessage,
  updateCurrentNode,
  endSession as endDbSession,
  fetchEndNodeText,
} from '../../api/chatFlowApi';
import { auth } from '../../lib/supabase';

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
  
  // Debug modal state changes
  useEffect(() => {
    console.log('showLogoutModal changed:', showLogoutModal);
  }, [showLogoutModal]);
  
  // Debug toasts state changes
  useEffect(() => {
    console.log('toasts changed:', toasts);
  }, [toasts]);
  const [isLoading, setIsLoading] = useState(true);

  // Database-backed state for About Us flow
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

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

  // Load recent sessions from database
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

  // ---------------- Database-backed About Us flow logic ----------------
  const initializeAboutFlow = async (title: string) => {
    setActiveFlowId('about');
    setIsTyping(true);
    try {
      const { data: userData } = await auth.getUser();
      const customerId = userData?.user?.id;
      if (!customerId) throw new Error('No authenticated user');

      // Create a new DB session
      const sessionId = await createSession(customerId);
      if (!sessionId) throw new Error('Failed to create session');
      setActiveSessionId(sessionId);

      // Create in-memory conversation wrapper for UI lists
      const conversation: Conversation = {
        id: sessionId,
        title,
        createdAt: Date.now(),
        messages: [],
        flowId: 'about',
        status: 'active',
        icon: undefined,
      };
      setConversations(prev => [conversation, ...prev]);
      setActiveId(sessionId);

      // Fetch initial node and attach session to flow
      const initialNode = await fetchInitialNode('about');
      if (!initialNode) throw new Error('No initial node');
      const attached = await attachSessionToFlow({ sessionId, flowId: 'about', nodeId: initialNode.node_id });
      if (!attached) throw new Error('Failed to attach session to flow');
      setActiveNodeId(initialNode.node_id);

      // Insert bot initial message in DB and reflect in UI
      await insertMessage({ sessionId, text: initialNode.text, role: 'printy', nodeId: initialNode.node_id });
      const fetched = await fetchSessionMessages(sessionId);
      setMessages(fetched.map(m => ({ id: m.id, role: m.role as ChatRole, text: m.text, ts: m.ts })));
      setConversations(prev => prev.map(c => (c.id === sessionId ? { ...c, messages: fetched.map(m => ({ id: m.id, role: m.role as ChatRole, text: m.text, ts: m.ts })) } : c)));

      // Load quick replies from options
      const options = await fetchOptions(initialNode.node_id);
      const replies = (options.length ? options.map((o, i) => ({ id: `qr-${i}`, label: o.label, value: o.label })) : [{ id: 'qr-end', label: 'End Chat', value: 'End Chat' }]);
      setQuickReplies(replies);
      updateInputPlaceholder('about', replies);
    } catch (e) {
      console.error('initializeAboutFlow DB error', e);
      toastMethods.error('Error', 'Failed to initialize About Us chat. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleAboutFlowSend = async (text: string) => {
    if (!activeSessionId || !activeNodeId) return;
    
    const conversationId = activeSessionId;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user' as ChatRole, text, ts: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setConversations(prev => prev.map(c => (c.id === conversationId ? { ...c, messages: [...c.messages, userMessage] } : c)));
    setIsTyping(true);
    setQuickReplies([]);
    
    try {
      // Persist user message
      await insertMessage({ sessionId: activeSessionId, text, role: 'user' });
      // Resolve option from current node
      const options = await fetchOptions(activeNodeId);
      const match = options.find(o => o.label.toLowerCase() === text.trim().toLowerCase());
      if (!match) {
        // Respond with generic prompt
        const prompt = 'Please choose one of the options.';
        await insertMessage({ sessionId: activeSessionId, text: prompt, role: 'printy', nodeId: activeNodeId });
      } else {
        // Move to next node
        await updateCurrentNode(activeSessionId, match.to_node_id);
        setActiveNodeId(match.to_node_id);
        // Fetch node content and reply
        const node = await fetchCurrentNode(activeSessionId);
        if (node) {
          await insertMessage({ sessionId: activeSessionId, text: node.text, role: 'printy', nodeId: node.node_id });
        }
      }
      // Refresh messages and quick replies
      const fetched = await fetchSessionMessages(activeSessionId);
      setMessages(fetched.map(m => ({ id: m.id, role: m.role as ChatRole, text: m.text, ts: m.ts })));
      setConversations(prev => prev.map(c => (c.id === conversationId ? { ...c, messages: fetched.map(m => ({ id: m.id, role: m.role as ChatRole, text: m.text, ts: m.ts })) } : c)));
      const nodeNow = await fetchCurrentNode(activeSessionId);
      const newOptions = nodeNow ? await fetchOptions(nodeNow.node_id) : [];
      const replies = (newOptions.length ? newOptions.map((o, i) => ({ id: `qr-${i}`, label: o.label, value: o.label })) : [{ id: 'qr-end', label: 'End Chat', value: 'End Chat' }]);
      setQuickReplies(replies);
      updateInputPlaceholder('about', replies);
    } catch (e) {
      console.error('handleAboutFlowSend DB error', e);
      toastMethods.error('Error', 'Failed to process message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  // ---------------- Chat logic ----------------
  const initializeFlow = (flowId: string, title: string, ctx: unknown = {}) => {
    // Use database-backed logic for About Us flow
    if (flowId === 'about') {
      initializeAboutFlow(title);
      return;
    }

    // Use manual logic for other flows
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

  // Listen for Pay Now button to open Payment chat
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
      switchConversation(sessionId);
    };
    window.addEventListener('customer-open-session', handler as EventListener);
    return () => window.removeEventListener('customer-open-session', handler as EventListener);
  }, [conversations]);

  const updateInputPlaceholder = (flowId: string, replies: QuickReply[]) => {
    if (flowId === 'issue-ticket' && replies.length === 0) {
      setInputPlaceholder('Enter your Order ID (e.g., ORD-123456)');
    } else {
      setInputPlaceholder('Type a message...');
    }
  };

  // central user input handler (works for typed send and quick replies)
  const handleUserInput = async (text: string) => {
    // Use database-backed logic for About Us flow
    if (activeFlowId === 'about') {
      await handleAboutFlowSend(text);
      return;
    }

    // Use manual logic for other flows
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

  const handleEndChat = async () => {
    if (!activeId) return;
    
    // Handle database-backed About Us flow
    if (activeFlowId === 'about' && activeSessionId) {
      try {
        // Get end node text from database
        const endNode = await fetchEndNodeText('about');
        if (endNode) {
          await insertMessage({ sessionId: activeSessionId, text: endNode.text, role: 'printy', nodeId: endNode.nodeId });
          const endMessage: ChatMessage = { id: crypto.randomUUID(), role: 'printy' as ChatRole, text: endNode.text, ts: Date.now() };
          setMessages(prev => [...prev, endMessage]);
          setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, messages: [...c.messages, endMessage] } : c)));
        }
        // End session in database
        await endDbSession(activeSessionId);
      } catch (e) {
        console.error('handleEndChat DB error', e);
      }
    }
    
    setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, status: 'ended' } : c)));
    setActiveId(null);
    setMessages([]);
    setQuickReplies([]);
    setCurrentFlow(null);
    setActiveSessionId(null);
    setActiveFlowId(null);
    setActiveNodeId(null);
  };

  // Switch to a specific conversation
  const switchConversation = async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    setActiveId(conversationId);
    
    // Handle database-backed About Us flow
    if (conversation.flowId === 'about') {
      setActiveSessionId(conversationId);
      setActiveFlowId('about');
      try {
        const fetched = await fetchSessionMessages(conversationId);
        setMessages(fetched.map(m => ({ id: m.id, role: m.role as ChatRole, text: m.text, ts: m.ts })));
        const node = await fetchCurrentNode(conversationId);
        const opts = node ? await fetchOptions(node.node_id) : [];
        const replies = (opts.length ? opts.map((o, i) => ({ id: `qr-${i}`, label: o.label, value: o.label })) : []);
        if (conversation.status === 'ended') {
          setQuickReplies([]);
        } else {
          setQuickReplies(replies);
          updateInputPlaceholder('about', replies);
        }
        if (node) setActiveNodeId(node.node_id);
      } catch (e) {
        console.error('switchConversation DB error', e);
        toastMethods.error('Error', 'Failed to load conversation. Please try again.');
      }
      return;
    }

    // Handle manual flows
    setMessages(conversation.messages);
    
    // Find and set the current flow
    const flow = flows[conversation.flowId];
    if (flow) {
      setCurrentFlow(flow);
      const replies: QuickReply[] = flow
        .quickReplies()
        .map((label: string, index: number) => ({ id: `qr-${index}`, label, value: label }));
      setQuickReplies(replies);
      updateInputPlaceholder(conversation.flowId, replies);
    }
  };

  // Handle file attachments
  const handleAttachFiles = (files: FileList) => {
    const f = files?.[0];
    if (f) {
      const url = URL.createObjectURL(f);
      // Send the image URL so it renders in chat and triggers payment flow detection
      handleUserInput(url);
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
          onSwitchConversation={switchConversation}
          onNavigateToAccount={() => navigate('/customer/account')}
          bottomActions={
            <LogoutButton onClick={() => {
              console.log('Logout button clicked');
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
            onSend={handleUserInput}
            isTyping={isTyping}
            onBack={() => setActiveId(null)}
            quickReplies={quickReplies}
            onQuickReply={handleQuickReply}
            inputPlaceholder={inputPlaceholder}
            onEndChat={handleEndChat}
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
          console.log('Logout modal closed');
          setShowLogoutModal(false);
        }}
        onConfirm={async () => {
          console.log('Logout confirmed');
          try {
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error('Logout error:', error);
              toastMethods.error('Logout Error', 'Failed to log out. Please try again.');
              return;
            }
            
            // Show success toast and wait a bit before redirecting
            console.log('Showing success toast');
            const toastId = toastMethods.success('Logged Out', 'You have been successfully logged out.');
            console.log('Toast created with ID:', toastId);
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