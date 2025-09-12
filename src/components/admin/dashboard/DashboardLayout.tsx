import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './desktop/Sidebar';
import { Text, Button } from '../../shared';
import ChatDock from '../../shared/ChatDock';
import type { SelectedItem } from '../../../pages/admin/AdminContext';
import ChatPanel from '../../chat/CustomerChatPanel';
import { MessageSquare, X, Minimize2 } from 'lucide-react';
import { AdminProvider } from '../../../pages/admin/AdminContext';
import useAdminChat from '../../../hooks/admin/useAdminChat';
import useAdminNav from '../../../hooks/admin/useAdminNav';
import { useIsMobile } from './index';
import { SelectionProvider } from '../../../hooks/admin/SelectionContext';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const { go } = useAdminNav();
  const isMobile = useIsMobile();
  const {
    chatOpen,
    setChatOpen,
    messages,
    isTyping,
    quickReplies,
    handleChatOpen,
    endChatWithDelay,
    handleSendMessage,
    handleQuickReply,
  } = useAdminChat();
  const [selected, setSelected] = useState<SelectedItem[]>([]);

  

  const handleLogout = () => {
    navigate('/auth/signin');
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
      <SelectionProvider
        onAddToChat={(items, entityType) => {
          setSelected(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const mapped = items
              .filter(i => !existingIds.has(i.id))
              .map(i => ({ id: i.id, label: i.label, type: entityType }));
            return [...prev, ...mapped];
          });
          setChatOpen(true);
        }}
        onOpenChat={() => setChatOpen(true)}
      >
        <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
        <Sidebar active="dashboard" onNavigate={go} onLogout={handleLogout} />

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
                Admin Dashboard
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
              <div className="px-4 sm:px-6 lg:px-8 py-6">
                <Text variant="p" size="sm" color="muted">
                  Admin dashboard widgets are coming soon.
                </Text>
              </div>
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
      </SelectionProvider>
    </AdminProvider>
  );
};

export default DashboardLayout;
