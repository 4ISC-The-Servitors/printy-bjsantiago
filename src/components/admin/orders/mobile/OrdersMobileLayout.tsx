import React, { useState } from 'react';
import { Button, Card, Text, Badge, Checkbox } from '../../../shared';
import { cn } from '../../../../lib/utils';
import { Trash2, X, MessageCircle } from 'lucide-react';
import {
  MobileSidebar,
  MobileHeader,
  MobileCardMenu,
  MobileSelectionMode,
} from '../../_shared/mobile';

interface Order {
  id: string;
  customer: string;
  total: string;
  date: string;
  status:
    | 'Pending'
    | 'Processing'
    | 'Awaiting Payment'
    | 'For Delivery/Pick-up'
    | 'Completed'
    | 'Cancelled';
  priority?: 'Urgent';
}

// removed unused SelectedComponent

interface OrdersMobileLayoutProps {
  mockOrders: Order[];
  selectedOrders: string[];
  setSelectedOrders: (orders: string[]) => void;
  setHoveredOrder: (id: string | null) => void;
  handleOrderSelect: (orderId: string) => void;
  addSelectedToChat: () => void;
  getStatusColor: (status: string) => string;
}

const OrdersMobileLayout: React.FC<OrdersMobileLayoutProps> = ({
  mockOrders,
  selectedOrders,
  setSelectedOrders,
  setHoveredOrder,
  handleOrderSelect,
  addSelectedToChat,
  getStatusColor,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [activeCardMenu, setActiveCardMenu] = useState<string | null>(null);

  const hasSelectedItems = selectedOrders.length > 0;

  const handleViewInChat = (_orderId: string) => {
    setActiveCardMenu(null);
  };

  const handleSelectMode = (orderId: string) => {
    setIsSelectionMode(true);
    handleOrderSelect(orderId);
    setActiveCardMenu(null);
  };

  const handleAddToChat = () => {
    addSelectedToChat();
    setIsSelectionMode(false);
    setSelectedOrders([]);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSettingsClick={() => {
          // TODO: Navigate to settings
          setIsSidebarOpen(false);
        }}
        onLogoutClick={() => {
          // TODO: Handle logout
          setIsSidebarOpen(false);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <MobileHeader
          title="Orders"
          onMenuClick={() => setIsSidebarOpen(true)}
          rightContent={
            (selectedOrders.length > 0 || isSelectionMode) && (
              <div className="flex items-center gap-2">
                {selectedOrders.length > 0 && (
                  <Text variant="p" size="sm" color="muted">
                    {selectedOrders.length}
                  </Text>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedOrders([]);
                    setIsSelectionMode(false);
                  }}
                  className="min-h-[44px] min-w-[44px]"
                >
                  {isSelectionMode ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )
          }
        />

        <main className="flex-1 overflow-auto pb-20">
          <div className="p-4">
            <div className="max-w-7xl mx-auto">
              <Card className="w-full">
                <div className="flex flex-row items-center justify-between space-y-0 pb-4 p-4">
                  <Text
                    variant="h3"
                    size="base"
                    weight="semibold"
                    className="text-gray-900"
                  >
                    All Orders
                  </Text>
                  {(selectedOrders.length > 0 || isSelectionMode) && (
                    <div className="flex items-center gap-2">
                      {selectedOrders.length > 0 && (
                        <Text variant="p" size="sm" color="muted">
                          {selectedOrders.length}
                        </Text>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrders([]);
                          setIsSelectionMode(false);
                        }}
                        className="min-h-[44px] min-w-[44px]"
                      >
                        {isSelectionMode ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-3 px-4 pb-4">
                  {mockOrders.map(order => (
                    <div
                      key={order.id}
                      className="relative flex items-center justify-between p-3 border border-gray-200 rounded-lg active:bg-gray-100 transition-colors min-h-[60px]"
                      onTouchStart={() => setHoveredOrder(order.id)}
                      onTouchEnd={() => setHoveredOrder(null)}
                    >
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10">
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => handleOrderSelect(order.id)}
                          className={cn(
                            'transition-opacity bg-white border-2 border-gray-300 w-4 h-4 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
                            selectedOrders.length > 0 || isSelectionMode
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </div>

                      <div className="flex items-center gap-3 min-w-0 flex-1 pl-4">
                        <div className="min-w-0 flex-1">
                          <Text
                            variant="p"
                            size="xs"
                            color="muted"
                            className="truncate"
                          >
                            {order.id}
                          </Text>
                          <Text
                            variant="p"
                            size="sm"
                            weight="medium"
                            className="truncate"
                          >
                            {order.customer}
                          </Text>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              className={cn(
                                getStatusColor(order.status),
                                'text-xs'
                              )}
                              variant="secondary"
                            >
                              {order.priority === 'Urgent'
                                ? 'Urgent'
                                : order.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2 flex items-center gap-2">
                        <div>
                          <Text variant="p" size="sm" weight="bold">
                            {order.total}
                          </Text>
                          <Text variant="p" size="xs" color="muted">
                            {order.date}
                          </Text>
                        </div>
                        <MobileCardMenu
                          isOpen={activeCardMenu === order.id}
                          onToggle={() =>
                            setActiveCardMenu(
                              activeCardMenu === order.id ? null : order.id
                            )
                          }
                          actions={[
                            {
                              label: 'View in Chat',
                              onClick: () => handleViewInChat(order.id),
                              icon: <MessageCircle className="w-4 h-4" />,
                            },
                            {
                              label: 'Select',
                              onClick: () => handleSelectMode(order.id),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>

        <MobileSelectionMode
          isActive={hasSelectedItems && isSelectionMode}
          selectedCount={selectedOrders.length}
          onExit={() => {
            setIsSelectionMode(false);
            setSelectedOrders([]);
          }}
          onAddToChat={handleAddToChat}
          entityType="orders"
        />
      </div>

      {/* Bottom Navigation - This would be handled by the parent AdminShell */}
    </div>
  );
};

export default OrdersMobileLayout;
