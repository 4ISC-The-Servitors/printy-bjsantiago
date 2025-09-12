import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../dashboard/desktop/Sidebar';
import { Text, Button } from '../../shared';
import ChatDock from '../../shared/ChatDock';
import type { SelectedItem } from '../../../pages/admin/AdminContext';
import ChatPanel from '../../chat/CustomerChatPanel';
import type {
  ChatMessage,
  QuickReply,
  ChatRole,
} from '../../chat/_shared/types';
import { MessageSquare, X, Minimize2 } from 'lucide-react';
import { AdminProvider } from '../../../pages/admin/AdminContext';
import {
  resolveAdminFlow,
  dispatchAdminCommand,
} from '../../../chatLogic/admin';
import { useIsMobile } from '../dashboard/index';

const PortfolioLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [chatOpen, setChatOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);

  const go = (route: 'dashboard' | 'orders' | 'tickets' | 'portfolio' | 'settings') => {
    if (route === 'dashboard') navigate('/admin');
    if (route === 'orders') navigate('/admin/orders');
    if (route === 'tickets') navigate('/admin/tickets');
    if (route === 'portfolio') navigate('/admin/portfolio');
    if (route === 'settings') navigate('/admin/settings');
  };

  const handleLogout = () => {
    navigate('/auth/signin');
  };

  const endChatWithDelay = () => {
    const endMessage = {
      id: crypto.randomUUID(),
      role: 'printy' as const,
      text: 'Thank you for chatting with Printy! Have a great day. 👋',
      ts: Date.now(),
    };
    setMessages(prev => [...prev, endMessage]);
    setQuickReplies([]);
    setTimeout(() => {
      setChatOpen(false);
      setMessages([]);
    }, 2000);
  };

  const handleChatOpen = () => {
    setChatOpen(true);
    if (messages.length === 0) {
      const flow = resolveAdminFlow('intro');
      if (!flow) return;
      const initial = flow.initial({});
      setMessages(
        initial.map(m => ({
          id: crypto.randomUUID(),
          role: m.role as ChatRole,
          text: m.text,
          ts: Date.now(),
        }))
      );
      setQuickReplies(
        flow.quickReplies().map((l, index) => ({
          id: `qr-${index}`,
          label: l,
          value: l,
        }))
      );
    }
  };

  const handleSendMessage = (text: string) => {
    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      text,
      ts: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    const dispatched = dispatchAdminCommand(text);
    if (dispatched) {
      const d = dispatched as {
        messages?: { role: string; text: string }[];
        quickReplies?: string[];
      };
      const botMessages = (d.messages || []).map(
        (m: { role: string; text: string }) => ({
          id: crypto.randomUUID(),
          role: m.role as ChatRole,
          text: m.text,
          ts: Date.now(),
        })
      );
      setMessages(prev => [...prev, ...botMessages]);
      setQuickReplies(
        (d.quickReplies || []).map((l: string, index: number) => ({
          id: `qr-${index}`,
          label: l,
          value: l,
        }))
      );
      setIsTyping(false);
    } else {
      const flow = resolveAdminFlow('intro');
      if (!flow) return;
      void flow.respond({}, text).then(resp => {
        const botMessages = resp.messages.map(m => ({
          id: crypto.randomUUID(),
          role: m.role as ChatRole,
          text: m.text,
          ts: Date.now(),
        }));
        setMessages(prev => [...prev, ...botMessages]);
        setQuickReplies(
          (resp.quickReplies || []).map((l, index) => ({
            id: `qr-${index}`,
            label: l,
            value: l,
          }))
        );
        setIsTyping(false);
      });
    }
  };

  const handleQuickReply = (v: string) => {
    if (v.toLowerCase().includes('end')) {
      setMessages([]);
      return;
    }
    const flow = resolveAdminFlow('intro');
    if (!flow) return;
    void flow.respond({}, v).then(resp => {
      const botMessages = resp.messages.map(m => ({
        id: crypto.randomUUID(),
        role: m.role as ChatRole,
        text: m.text,
        ts: Date.now(),
      }));
      setMessages(prev => [...prev, ...botMessages]);
      setQuickReplies(
        (resp.quickReplies || []).map((l, index) => ({
          id: `qr-${index}`,
          label: l,
          value: l,
        }))
      );
    });
  };

  return (
    <AdminProvider
      value={{
        selected,
        addSelected: (item: SelectedItem) =>
          setSelected(prev =>
            prev.find(i => i.id === item.id) ? prev : [...prev, item]
          ),
        removeSelected: (id: string) =>
          setSelected(prev => prev.filter(i => i.id !== id)),
        clearSelected: () => setSelected([]),
        openChat: () => setChatOpen(true),
      }}
    >
      <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
        <Sidebar active="portfolio" onNavigate={go} onLogout={handleLogout} />

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
                Portfolio
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
            {isMobile && chatOpen ? (
              <div className="flex flex-col min-h-screen bg-white">
                <ChatPanel
                  title="Printy Assistant"
                  messages={messages}
                  onSend={handleSendMessage}
                  isTyping={isTyping}
                  quickReplies={quickReplies}
                  onQuickReply={handleQuickReply}
                  onEndChat={() => setChatOpen(false)}
                />
              </div>
            ) : (
              <div className="px-4 sm:px-6 lg:px-8 py-6">{children}</div>
            )}
          </div>
        </main>

        {!isMobile && (
          <ChatDock
            open={chatOpen}
            onToggle={() => setChatOpen(false)}
            selected={selected}
            onRemoveSelected={id =>
              setSelected(prev => prev.filter(i => i.id !== id))
            }
            onClearSelected={() => setSelected([])}
            header={
              <div className="flex items-center justify-between">
                <Text variant="h3" size="lg" weight="semibold">
                  Printy Assistant
                </Text>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    threeD
                    aria-label="Hide chat"
                    onClick={() => setChatOpen(false)}
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="accent"
                    size="sm"
                    threeD
                    aria-label="Close chat"
                    onClick={endChatWithDelay}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            }
          >
            <ChatPanel
              title="Printy Assistant"
              messages={messages}
              onSend={handleSendMessage}
              isTyping={isTyping}
              quickReplies={quickReplies}
              onQuickReply={handleQuickReply}
              onEndChat={endChatWithDelay}
            />
          </ChatDock>
        )}
      </div>
    </AdminProvider>
  );
};

export default PortfolioLayout;
