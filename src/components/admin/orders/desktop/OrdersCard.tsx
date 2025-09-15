import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Skeleton, Checkbox } from '../../../shared';
import { useOrderSelection } from '../../../../hooks/admin/SelectionContext';
import { createOrderSelectionItems } from '../../../../utils/admin/selectionUtils';
import { getOrderStatusBadgeVariant } from '../../../../utils/admin/statusColors';
import { MessageSquare, Plus } from 'lucide-react';
import { useAdmin } from '../../../../hooks/admin/AdminContext';
import { useOrders } from '../../../../hooks/admin/OrdersContext';
import { cn } from '../../../../lib/utils';

const OrdersCard: React.FC = () => {
  const orderSelection = useOrderSelection();
  const { openChatWithTopic, openChat, addSelected } = useAdmin();
  const { orders, updateOrder, refreshOrders } = useOrders();
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Limit to max 5 orders
  const displayOrders = orders.slice(0, 5);
  const orderItems = createOrderSelectionItems(displayOrders);

  const toggleOrderSelection = (orderId: string) => {
    const orderItem = orderItems.find(item => item.id === orderId);
    if (orderItem) {
      orderSelection.toggle(orderItem);
    }
  };

  const addSelectedToChat = () => {
    const selectedIds = orderSelection.selectedIds;
    if (selectedIds.length === 0) return;
    // Update selected chips bar
    selectedIds.forEach(id => {
      addSelected({ id, label: id, type: 'order' });
    });
    // Open MultipleOrders flow with selected IDs and orders context
    (openChatWithTopic as any)?.(
      'multiple-orders',
      undefined,
      updateOrder,
      orders,
      refreshOrders,
      selectedIds
    );
    if (!openChatWithTopic) {
      openChat();
    }
    orderSelection.clear();
  };

  if (isLoading) {
    return (
      <div className="relative">
        <Card className="p-0">
          <div className="flex items-center justify-end px-3 py-2 sm:px-4">
            <Skeleton variant="rectangular" width="40px" height="20px" />
          </div>
          <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 rounded-lg border bg-white/60"
              >
                <Skeleton variant="circular" width="16px" height="16px" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton variant="text" width="120px" height="16px" />
                    <Skeleton variant="text" width="100px" height="16px" />
                  </div>
                  <Skeleton variant="text" width="150px" height="14px" />
                  <div className="flex gap-2">
                    <Skeleton
                      variant="rectangular"
                      width="60px"
                      height="20px"
                    />
                    <Skeleton
                      variant="rectangular"
                      width="80px"
                      height="20px"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right space-y-1">
                    <Skeleton variant="text" width="80px" height="16px" />
                    <Skeleton variant="text" width="60px" height="14px" />
                  </div>
                  <Skeleton variant="rectangular" width="32px" height="32px" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      <Card className="p-0">
        <div className="flex items-center justify-end px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2 text-neutral-500 text-xs">
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
          {displayOrders.map(o => (
            <div
              key={o.id}
              className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 rounded-lg border bg-white/60 hover:bg-white transition-colors relative"
              onMouseEnter={() => setHoveredOrderId(o.id)}
              onMouseLeave={() => setHoveredOrderId(null)}
            >
              {/* Hover checkbox on left (matches Portfolio/Tickets behavior) */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
                <Checkbox
                  checked={orderSelection.isSelected(o.id)}
                  onCheckedChange={() => toggleOrderSelection(o.id)}
                  className={cn(
                    'transition-opacity bg-white border-2 border-gray-300 w-5 h-5 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
                    hoveredOrderId === o.id || orderSelection.selectionCount > 0 ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </div>

              <div className="flex w-full items-center justify-between gap-3 sm:gap-4 pl-6">
                {/* Left section: identifiers, customer, badges */}
                <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-xs sm:text-sm lg:text-base font-medium text-neutral-500 truncate">
                      {o.id}
                    </span>
                    <div className="text-sm sm:text-base lg:text-lg font-medium text-neutral-900 sm:hidden truncate">
                      {o.customer}
                    </div>
                  </div>

                  {/* Mobile badges */}
                  <div className="flex items-center justify-between sm:hidden">
                    <div className="flex items-center gap-2">
                      {o.priority && (
                        <Badge size="sm" variant="error" className="text-xs">
                          {o.priority}
                        </Badge>
                      )}
                      <Badge
                        size="sm"
                        variant={getOrderStatusBadgeVariant(o.status)}
                        className="text-xs"
                      >
                        {o.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Desktop: customer + badges */}
                  <div className="hidden sm:block text-sm sm:text-base lg:text-lg font-medium text-neutral-900 truncate">
                    {o.customer}
                  </div>
                  <div className="hidden sm:flex sm:items-center sm:gap-3">
                    {o.priority && (
                      <Badge
                        size="sm"
                        variant="error"
                        className="text-xs sm:text-sm"
                      >
                        {o.priority}
                      </Badge>
                    )}
                    <Badge
                      size="sm"
                      variant={getOrderStatusBadgeVariant(o.status)}
                      className="text-xs sm:text-sm"
                    >
                      {o.status}
                    </Badge>
                  </div>
                </div>

                {/* Right section: amount/date + action aligned right */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-right">
                    <div className="text-sm sm:text-base lg:text-lg xl:text-xl font-semibold">
                      {o.total}
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-500">
                      {o.date}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    threeD
                    aria-label={`Ask about ${o.id}`}
                    onClick={() => {
                      // Add single selection to chips bar
                      addSelected({ id: o.id, label: o.id, type: 'order' });
                      (openChatWithTopic as any)?.(
                        'orders',
                        o.id,
                        updateOrder,
                        orders,
                        refreshOrders
                      );
                      if (!openChatWithTopic) openChat();
                    }}
                    className="shrink-0"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Floating Add to Chat button (match Portfolio style) */}
      {orderSelection.hasSelections && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={addSelectedToChat}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-8 py-4 flex items-center gap-3 min-h-[64px] text-lg"
          >
            <Plus className="h-5 w-5" />
            Add to Chat ({orderSelection.selectionCount})
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrdersCard;
