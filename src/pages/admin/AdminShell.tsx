import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/admin/dashboard';
import { Text, Button } from '../../components/shared';
import ChatDock from '../../components/shared/ChatDock';
import type { ChipItem } from '../../components/shared/SelectedChipsBar';
import ChatPanel from '../../components/chat/CustomerChatPanel';
import type {
  ChatMessage,
  QuickReply,
  ChatRole,
} from '../../components/chat/_shared/types';
import { MessageSquare, X, Minimize2 } from 'lucide-react';
import { AdminProvider } from './AdminContext';
import { resolveAdminFlow, dispatchAdminCommand } from '../../chatLogic/admin';

const AdminShellDesktop: React.FC<{
  active: 'dashboard' | 'orders' | 'portfolio' | 'settings';
  go: (route: 'dashboard' | 'orders' | 'portfolio' | 'settings') => void;
  handleLogout: () => void;
}> = () => {
  return (
    <div className="flex-1 hidden lg:flex">
      <Outlet />
    </div>
  );
};

const AdminShellMobile: React.FC = () => {
  return (
    <div className="flex-1 lg:hidden">
      <Outlet />
    </div>
  );
};

const AdminShell: React.FC = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<
    'dashboard' | 'orders' | 'portfolio' | 'settings'
  >('dashboard');
  const [chatOpen, setChatOpen] = useState(false);
  const [selected, setSelected] = useState<ChipItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);

  const go = (route: typeof active) => {
    setActive(route);
    if (route === 'dashboard') navigate('/admin');
    if (route === 'orders') navigate('/admin/orders');
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

  return (
    <AdminProvider
      value={{
        selected,
        addSelected: (item: ChipItem) =>
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
        <Sidebar active={active} onNavigate={go} onLogout={handleLogout} />

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
                {/* Mobile/Tablet toggle button (icon only) */}
                {/* When chat open on mobile, show Hide and Close buttons; else show open button */}
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
                    onClick={() => {
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
                    }}
                    aria-label="Ask Printy"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                )}

                {/* Desktop button with icon only */}
                <Button
                  variant="secondary"
                  size="sm"
                  threeD
                  className="hidden lg:inline-flex"
                  onClick={() => {
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
                  }}
                  aria-label="Ask Printy"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* On small screens, show chat full-width when open */}
            <div
              className={`lg:hidden ${chatOpen ? 'flex' : 'hidden'} flex-col min-h-screen bg-white`}
            >
              <ChatPanel
                title="Printy Assistant"
                messages={messages}
                onSend={text => {
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
                      (d.quickReplies || []).map(
                        (l: string, index: number) => ({
                          id: `qr-${index}`,
                          label: l,
                          value: l,
                        })
                      )
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
                }}
                isTyping={isTyping}
                quickReplies={quickReplies}
                onQuickReply={v => {
                  if (v.toLowerCase().includes('end')) setMessages([]);
                }}
                onEndChat={() => setChatOpen(false)}
              />
            </div>
            {/* Route outlet wrapped by platform-specific shells */}
            <div className="hidden lg:block">
              <AdminShellDesktop />
            </div>
            <div className="lg:hidden">
              <AdminShellMobile />
            </div>
          </div>
        </main>

        {/* Desktop Chat Dock; on mobile, chat occupies content area */}
        {/* Desktop dock with its own compact header (icons) */}
        <ChatDock
          open={chatOpen}
          onToggle={() => setChatOpen(false)}
          selected={selected}
          onRemoveSelected={id =>
            setSelected(prev => prev.filter(i => i.id !== id))
          }
          onClearSelected={() => setSelected([])}
          header={
            <div className="hidden lg:flex items-center justify-between">
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
          {/* Desktop panel - hide its own header to avoid duplication with dock header */}
          <ChatPanel
            title="Printy Assistant"
            messages={messages}
            onSend={text => {
              const userMsg = {
                id: crypto.randomUUID(),
                role: 'user' as const,
                text,
                ts: Date.now(),
              };
              setMessages(prev => [...prev, userMsg]);
              setIsTyping(true);
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
            }}
            isTyping={isTyping}
            quickReplies={quickReplies}
            onQuickReply={v => {
              if (v.toLowerCase().includes('end')) {
                endChatWithDelay();
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
            }}
            onEndChat={endChatWithDelay}
          />
        </ChatDock>
      </div>
    </AdminProvider>
  );
};

export default AdminShell;
