import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../dashboard/desktop/Sidebar';
import { Text, Button, Card, Badge, Checkbox, useToast } from '../../../shared';
import ChatDock from '../../../shared/ChatDock';
import type { SelectedItem } from '../../../../pages/admin/AdminContext';
import ChatPanel from '../../../chat/CustomerChatPanel';
import { MessageSquare, X, Minimize2, MessageCircle, Trash2, Plus } from 'lucide-react';
import { AdminProvider } from '../../../../pages/admin/AdminContext';
import useAdminChat from '../../../../hooks/admin/useAdminChat';
import useAdminNav from '../../../../hooks/admin/useAdminNav';
import { useIsMobile } from '../../dashboard/index';
import { SelectionProvider } from '../../../../hooks/admin/SelectionContext';
import { getOrderStatusBadgeVariant } from '../../../../utils/admin/statusColors';
import { OrdersProvider, useOrders } from '../../../../hooks/admin/OrdersContext';
import { cn } from '../../../../lib/utils';


const OrdersDesktopLayoutContent: React.FC = () => {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [hoveredOrder, setHoveredOrder] = useState<string | null>(null);
  const { orders, updateOrder, refreshOrders } = useOrders();
  const [, toast] = useToast();
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

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const addSelectedToChat = () => {
    // Entity isolation: prevent mixing different entities in one add action
    const hasDifferentEntity = selected.some(s => s.type && s.type !== 'order');
    if (hasDifferentEntity) {
      toast.error(
        'Cannot mix entities',
        'You have non-Order items selected. Clear selection first.'
      );
      return;
    }
    selectedOrders.forEach(orderId => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const newItem: SelectedItem = {
          id: order.id,
          label: order.id,
          type: 'order',
        };
        setSelected(prev =>
          prev.find(i => i.id === newItem.id) ? prev : [...prev, newItem]
        );
      }
    });
    const orderIds = selectedOrders.slice();
    setSelectedOrders([]);
    // Initialize multiple-orders flow with selected IDs so bot greets immediately
    handleChatOpenWithTopic('multiple-orders', undefined, updateOrder, orders, refreshOrders, orderIds);
  };


  const hasSelectedItems = selectedOrders.length > 0;

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
        openChatWithTopic: (topic: string, orderId?: string) => handleChatOpenWithTopic(topic, orderId, updateOrder, orders, refreshOrders),
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
          const orderIds = items.map(i => i.id);
          // Open chat and initialize the multiple-orders flow with selected IDs
          handleChatOpenWithTopic('multiple-orders', undefined, updateOrder, orders, refreshOrders, orderIds);
        }}
        onOpenChat={() => setChatOpen(true)}
      >
        <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
          <Sidebar active="orders" onNavigate={go} onLogout={handleLogout} />

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
                  Orders
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
                  {/* Orders content */}
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
                            All Orders
                          </Text>
                          {selectedOrders.length > 0 && (
                            <div className="flex items-center gap-3">
                              <Text variant="p" size="base" color="muted">
                                {selectedOrders.length} selected
                              </Text>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrders([])}
                                className="min-h-[44px] min-w-[44px]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4 px-8 pb-8">
                          {orders.map(order => (
                            <div
                              key={order.id}
                              className="relative flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[80px]"
                              onMouseEnter={() => setHoveredOrder(order.id)}
                              onMouseLeave={() => setHoveredOrder(null)}
                            >
                              <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
                                <Checkbox
                                  checked={selectedOrders.includes(order.id)}
                                  onCheckedChange={() => handleOrderSelect(order.id)}
                                  className={cn(
                                    'transition-opacity bg-white border-2 border-gray-300 w-5 h-5 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
                                    hoveredOrder === order.id || selectedOrders.length > 0
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
                                    {order.id}
                                  </Text>
                                  <Text
                                    variant="p"
                                    size="lg"
                                    weight="medium"
                                    className="truncate"
                                  >
                                    {order.customer}
                                  </Text>
                                  <div className="flex items-center gap-2 mt-2">
                                    {order.priority === 'Urgent' && (
                                      <Badge
                                        variant="error"
                                        className="text-sm px-3 py-1"
                                      >
                                        Urgent
                                      </Badge>
                                    )}
                                    <Badge
                                      variant={getOrderStatusBadgeVariant(order.status)}
                                      className="text-sm px-3 py-1"
                                    >
                                      {order.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <Text variant="p" size="xl" weight="bold">
                                  {order.total}
                                </Text>
                                <Text variant="p" size="base" color="muted">
                                  {order.date}
                                </Text>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  threeD
                                  className="mt-2 min-h-[44px] min-w-[44px]"
                                  title="View in Chat"
                                  onClick={() => handleChatOpenWithTopic('orders', order.id, updateOrder, orders, refreshOrders)}
                                >
                                  <MessageCircle className="h-4 w-4" />
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
                            Add to Chat ({selectedOrders.length})
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

const OrdersDesktopLayout: React.FC = () => {
  return (
    <OrdersProvider>
      <OrdersDesktopLayoutContent />
    </OrdersProvider>
  );
};

export default OrdersDesktopLayout;