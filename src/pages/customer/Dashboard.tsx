import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatPanel from '../../components/customer/chatPanel/ChatPanel';
import {} from '../../components/chat/_shared/types';
import SidebarPanel from '../../components/customer/shared/sidebar/SidebarPanel';
import LogoutButton from '../../components/customer/shared/sidebar/LogoutButton';
import LogoutModal from '../../components/customer/shared/sidebar/LogoutModal';
import ChatCards from '../../components/customer/dashboard/chatCards/ChatCards';
import RecentOrder from '../../components/customer/dashboard/recentOrders/RecentOrder';
import RecentTickets from '../../components/customer/dashboard/recentTickets/RecentTickets';
import { ToastContainer, Text, PageLoading } from '../../components/shared';
import { mockOrders } from '../../data/orders';
import useCustomerConversations from '../../hooks/customer/useCustomerConversations';
import { ShoppingCart, HelpCircle, TicketIcon, Info, MessageSquare, Settings } from 'lucide-react';

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

// Conversation type now encapsulated inside the hook

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

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    toasts,
    toastMethods,
    messages,
    isTyping,
    conversations,
    activeId,
    quickReplies,
    inputPlaceholder,
    initializeFlow,
    handleSend,
    handleQuickReply,
    handleAttachFiles,
    switchConversation,
    endChat,
    setActiveId,
  } = useCustomerConversations();
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

  // Topics grid now rendered via ChatCards; explicit topics array no longer needed

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
  const [recentOrder] = useState(() => {
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


  // input placeholder handled by the hook

  // Payment chat event handling is now managed by useCustomerConversations hook

  // Cancel order chat event handling is now managed by useCustomerConversations hook

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
  }, [switchConversation]);

  const handleTopic = (key: TopicKey) => {
    const cfg = topicConfig[key];
    initializeFlow(cfg.flowId, cfg.label);
  };





  const handleBack = () => {
    // Just go back to dashboard without ending the conversation
    setActiveId(null);
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
      {/* Layouts: use Mobile/desktop placements directly */}
      <div className="hidden lg:flex w-64 bg-white border-r border-neutral-200 flex-col">
        <SidebarPanel
          conversations={conversations as any}
          activeId={activeId}
          onSwitchConversation={switchConversation}
          onNavigateToAccount={() => navigate('/customer/account')}
          bottomActions={<LogoutButton onClick={handleLogout} />}
        />
      </div>
      <div className="lg:hidden fixed left-0 top-0 bottom-0 w-16 bg-white border-r border-neutral-200 z-50">
        <SidebarPanel
          conversations={conversations as any}
          activeId={activeId}
          onSwitchConversation={switchConversation}
          onNavigateToAccount={() => navigate('/customer/account')}
          bottomActions={<LogoutButton onClick={handleLogout} />}
        />
      </div>
      {/* Main Content - Full Screen for Chat */}
      <main className={`flex-1 flex flex-col pl-16 lg:pl-0`}>
        {isLoading ? (
          <PageLoading variant="dashboard" />
        ) : activeId ? (
          // Full screen chat without containers
          <ChatPanel
            title={conversations.find(c => c.id === activeId)?.title || 'Chat'}
            messages={messages}
            onSend={handleSend}
            isTyping={isTyping}
            onBack={handleBack}
            quickReplies={quickReplies}
            onQuickReply={handleQuickReply}
            inputPlaceholder={inputPlaceholder}
            onEndChat={endChat}
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
                <RecentOrder recentOrder={recentOrder} />
                <RecentTickets recentTicket={recentTicket} />
              </div>
              <ChatCards onSelect={key => handleTopic(key as TopicKey)} />
            </div>
          </div>
        )}
      </main>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />

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
