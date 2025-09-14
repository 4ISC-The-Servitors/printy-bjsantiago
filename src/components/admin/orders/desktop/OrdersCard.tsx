import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Skeleton } from '../../../shared';
import { mockOrders } from '../../../../data/orders';
import { useOrderSelection } from '../../../../hooks/admin/SelectionContext';
import { createOrderSelectionItems } from '../../../../utils/admin/selectionUtils';
import { getOrderStatusBadgeVariant } from '../../../../utils/admin/statusColors';
import { MessageSquare, Plus } from 'lucide-react';
import { useAdmin } from '../../../../pages/admin/AdminContext';

const OrdersCard: React.FC = () => {
  const orderSelection = useOrderSelection();
  const { addSelected, openChatWithTopic } = useAdmin();
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Limit to max 5 orders
  const displayOrders = mockOrders.slice(0, 5);
  const orderItems = createOrderSelectionItems(displayOrders);

  const toggleOrderSelection = (orderId: string) => {
    const orderItem = orderItems.find(item => item.id === orderId);
    if (orderItem) {
      orderSelection.toggle(orderItem);
    }
  };

  const addSelectedToChat = () => {
    orderSelection.selected.forEach(item => {
      addSelected({ id: item.id, label: item.label, type: 'order' });
    });
    orderSelection.clear();
    openChatWithTopic?.('orders');
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
            <Badge size="sm" variant="secondary">
              {displayOrders.length}
            </Badge>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
          {displayOrders.map(o => (
            <div
              key={o.id}
              className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 rounded-lg border bg-white/60 hover:bg-white transition-colors relative"
            >
              {/* Hover checkbox on left */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-brand-primary"
                  checked={orderSelection.isSelected(o.id)}
                  onChange={() => toggleOrderSelection(o.id)}
                  title="Select order"
                />
              </div>

              <div className="flex w-full items-center justify-between gap-3 sm:gap-4">
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
                    onClick={() => openChatWithTopic?.('orders')}
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

      {/* Floating Add to Chat button */}
      {orderSelection.hasSelections && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            variant="primary"
            size="lg"
            threeD
            onClick={addSelectedToChat}
            className="shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Chat ({orderSelection.selectionCount})
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrdersCard;
