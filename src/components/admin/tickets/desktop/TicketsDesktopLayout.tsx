import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../dashboard/desktop/Sidebar';
import { Text, Button, Card, Badge, Checkbox } from '../../../shared';
import ChatDock from '../../../shared/ChatDock';
import type { SelectedItem } from '../../../../pages/admin/AdminContext';
import ChatPanel from '../../../chat/CustomerChatPanel';
import { MessageSquare, X, Minimize2, Trash2, Plus } from 'lucide-react';
import { AdminProvider } from '../../../../pages/admin/AdminContext';
import useAdminChat from '../../../../hooks/admin/useAdminChat';
import useAdminNav from '../../../../hooks/admin/useAdminNav';
import { useIsMobile } from '../../dashboard/index';
import { SelectionProvider } from '../../../../hooks/admin/SelectionContext';
import { mockTickets } from '../../../../data/tickets';
import { cn } from '../../../../lib/utils';

const TicketsDesktopLayout: React.FC = () => {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [hoveredTicket, setHoveredTicket] = useState<string | null>(null);
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
    handleChatOpenWithTopic,
    endChatWithDelay,
    handleSendMessage,
    handleQuickReply,
  } = useAdminChat();
  const [selected, setSelected] = useState<SelectedItem[]>([]);

  const handleLogout = () => {
    navigate('/auth/signin');
  };

  const handleTicketSelect = (ticketId: string) => {
    setSelectedTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const addSelectedToChat = () => {
    selectedTickets.forEach(ticketId => {
      const ticket = mockTickets.find(t => t.id === ticketId);
      if (ticket) {
        const newItem: SelectedItem = {
          id: ticket.id,
          label: ticket.id,
          type: 'ticket',
        };
        setSelected(prev =>
          prev.find(i => i.id === newItem.id) ? prev : [...prev, newItem]
        );
      }
    });
    const ticketIds = selectedTickets.slice();
    setSelectedTickets([]);
    // Initialize tickets flow for the first selected or open chat
    if (ticketIds.length > 0) {
      handleChatOpenWithTopic('tickets', ticketIds[0]);
    } else {
      handleChatOpen();
    }
  };

  const hasSelectedItems = selectedTickets.length > 0;

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
        openChatWithTopic: (topic: string, ticketId?: string) =>
          handleChatOpenWithTopic(topic, ticketId),
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
          if (items.length > 0) {
            handleChatOpenWithTopic('tickets', items[0].id);
          } else {
            setChatOpen(true);
          }
        }}
        onOpenChat={() => setChatOpen(true)}
      >
        <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
          <Sidebar active="tickets" onNavigate={go} onLogout={handleLogout} />

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
                  Tickets
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
                  <div className="flex-1 p-8 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                      <Card className="w-full">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-6 p-8">
                          <Text
                            variant="h3"
                            size="xl"
                            weight="semibold"
                            className="text-gray-900"
                          >
                            All Tickets
                          </Text>
                          {selectedTickets.length > 0 && (
                            <div className="flex items-center gap-3">
                              <Text variant="p" size="base" color="muted">
                                {selectedTickets.length} selected
                              </Text>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTickets([])}
                                className="min-h-[44px] min-w-[44px]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4 px-8 pb-8">
                          {mockTickets.map(ticket => (
                            <div
                              key={ticket.id}
                              className="relative flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[80px]"
                              onMouseEnter={() => setHoveredTicket(ticket.id)}
                              onMouseLeave={() => setHoveredTicket(null)}
                            >
                              <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
                                <Checkbox
                                  checked={selectedTickets.includes(ticket.id)}
                                  onCheckedChange={() =>
                                    handleTicketSelect(ticket.id)
                                  }
                                  className={cn(
                                    'transition-opacity bg-white border-2 border-gray-300 w-5 h-5 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
                                    hoveredTicket === ticket.id ||
                                      selectedTickets.length > 0
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </div>
                              <div className="flex items-center gap-4 min-w-0 flex-1 pl-6">
                                <div className="min-w-0 flex-1">
                                  <Text
                                    variant="p"
                                    size="sm"
                                    color="muted"
                                    className="truncate"
                                  >
                                    {ticket.id}
                                  </Text>
                                  <Text
                                    variant="p"
                                    size="lg"
                                    weight="medium"
                                    className="truncate"
                                  >
                                    {ticket.subject}
                                  </Text>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge
                                      className={cn('text-sm px-3 py-1')}
                                      variant="secondary"
                                    >
                                      {ticket.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <Text variant="p" size="base" color="muted">
                                  {ticket.time}
                                </Text>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  threeD
                                  className="mt-2 min-h-[44px] min-w-[44px]"
                                  title="View in Chat"
                                  onClick={() =>
                                    handleChatOpenWithTopic(
                                      'tickets',
                                      ticket.id
                                    )
                                  }
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {hasSelectedItems && (
                        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
                          <Button
                            onClick={addSelectedToChat}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-8 py-4 flex items-center gap-3 min-h-[64px] text-lg"
                          >
                            <Plus className="h-5 w-5" />
                            Add to Chat ({selectedTickets.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
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

export default TicketsDesktopLayout;
