import React from 'react';
import useAdminChat from '@hooks/admin/useAdminChat';
import { useAdmin } from '@hooks/admin/AdminContext';
import Sidebar from '../_shared/desktop/Sidebar';
import useAdminNav from '@hooks/admin/useAdminNav';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Text, Button } from '@components/shared';
import { MessageSquare, Minimize2, X } from 'lucide-react';
import AdminMobileLayout from './AdminMobileLayout';
import AdminChatDock from '@components/admin/chat/AdminChatDock';

interface Props {
  children: React.ReactNode;
}

// Simple breakpoint check using CSS media query
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = React.useState<boolean>(
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 1024px)').matches
      : true
  );
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', listener);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener('change', listener);
  }, []);
  return isDesktop;
};

const AdminLayout: React.FC<Props> = ({ children }) => {
  const isDesktop = useIsDesktop();
  const { selected, clearSelected, removeSelected } = useAdmin();
  const {
    chatOpen,
    setChatOpen,
    messages,
    isTyping,
    quickReplies,
    handleChatOpen,
    handleChatOpenWithTopic,
    endChatWithDelay,
    handleSendMessage,
    handleQuickReply,
  } = useAdminChat();
  const { go } = useAdminNav();
  const location = useLocation();
  const navigate = useNavigate();
  // Listen for external requests to open chat and optionally set topic/context
  React.useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (detail && detail.topic) {
        handleChatOpenWithTopic(
          detail.topic,
          detail.orderId,
          detail.updateOrder,
          detail.orders,
          detail.refreshOrders,
          detail.orderIds
        );
      } else {
        handleChatOpen();
      }
    };
    window.addEventListener('admin-chat-open', onOpen as EventListener);
    return () => window.removeEventListener('admin-chat-open', onOpen as EventListener);
  }, [handleChatOpen, handleChatOpenWithTopic]);

  const active: 'dashboard' | 'orders' | 'tickets' | 'portfolio' | 'settings' =
    location.pathname === '/admin'
      ? 'dashboard'
      : location.pathname.startsWith('/admin/orders')
        ? 'orders'
        : location.pathname.startsWith('/admin/tickets')
          ? 'tickets'
          : location.pathname.startsWith('/admin/portfolio')
            ? 'portfolio'
            : 'settings';

  if (isDesktop) {
    return (
      <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
        <Sidebar
          active={active}
          onNavigate={go}
          onLogout={() => navigate('/auth/signin')}
        />

        <main
          className={`flex-1 flex flex-col ${chatOpen ? 'lg:pr-[420px]' : ''} pl-16 lg:pl-0 overflow-y-auto scrollbar-hide`}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-4 border-b bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between relative">
              <Text
                variant="h1"
                size="2xl"
                weight="bold"
                className="text-neutral-900"
              >
                Admin
              </Text>
              <div className="flex items-center gap-2">
                {chatOpen ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      threeD
                      className="lg:hidden"
                      onClick={() => setChatOpen(false)}
                      aria-label="Hide chat"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="accent"
                      size="sm"
                      threeD
                      className="lg:hidden"
                      onClick={endChatWithDelay}
                      aria-label="Close chat"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    threeD
                    className="lg:hidden"
                    onClick={handleChatOpen}
                    aria-label="Ask Printy"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  threeD
                  className="hidden lg:inline-flex"
                  onClick={handleChatOpen}
                  aria-label="Ask Printy"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-6">{children}</div>
          </div>
        </main>

        <AdminChatDock
          open={chatOpen}
          onToggle={() => setChatOpen(false)}
          selected={selected}
          onRemoveSelected={removeSelected}
          onClearSelected={clearSelected}
          messages={messages}
          isTyping={isTyping}
          quickReplies={quickReplies}
          onSend={handleSendMessage}
          onQuickReply={handleQuickReply}
          onEndChat={endChatWithDelay}
        />
      </div>
    );
  }

  return (
    <AdminMobileLayout
      title="Admin"
      open={chatOpen}
      onOpen={handleChatOpen}
      onClose={endChatWithDelay}
      messages={messages}
      isTyping={isTyping}
      quickReplies={quickReplies}
      onSend={handleSendMessage}
      onQuickReply={handleQuickReply}
      headerRight={null}
    >
      {children}
    </AdminMobileLayout>
  );
};

export default AdminLayout;
