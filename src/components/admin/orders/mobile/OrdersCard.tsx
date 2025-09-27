import React, { useEffect, useState } from 'react';
import {
  Card,
  Badge,
  Button,
  Checkbox,
  Skeleton,
  Pagination,
} from '../../../shared';
import { useAdmin } from '../../../../hooks/admin/AdminContext';
import { Plus } from 'lucide-react';
import { useOrders } from '../../../../hooks/admin/OrdersContext';
import useResponsivePageSize from '../../../../hooks/shared/useResponsivePageSize';
import { useOrderSelection } from '../../../../hooks/admin/SelectionContext';
import { createOrderSelectionItems } from '../../../../utils/admin/selectionUtils';
import { getOrderStatusBadgeVariant } from '../../../../utils/admin/statusColors';
import MobileCardMenu from '../../_shared/mobile/MobileCardMenu';
import { cn } from '../../../../lib/utils';

const OrdersCard: React.FC = () => {
  const orderSelection = useOrderSelection();
  const { openChatWithTopic, openChat, addSelected } = useAdmin();
  const { orders, updateOrder, refreshOrders } = useOrders();
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const responsivePageSize = useResponsivePageSize({
    phone: 2,
    tablet: 3,
    desktop: 5,
  });
  const pageSize = responsivePageSize;

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // Clamp page when page size changes
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [pageSize, orders.length, page]);

  // Paginate orders (5 per page)
  const start = (page - 1) * pageSize;
  const displayOrders = orders.slice(start, start + pageSize);
  const orderItems = createOrderSelectionItems(displayOrders);

  const toggleOrderSelection = (orderId: string) => {
    const orderItem = orderItems.find(item => item.id === orderId);
    if (orderItem) orderSelection.toggle(orderItem);
  };

  const addSelectedToChat = () => {
    const selectedIds = orderSelection.selectedIds;
    if (selectedIds.length === 0) return;
    selectedIds.forEach(id => addSelected({ id, label: id, type: 'order' }));
    (openChatWithTopic as any)?.(
      'multiple-orders',
      undefined,
      updateOrder,
      orders,
      refreshOrders,
      selectedIds
    );
    if (!openChatWithTopic) openChat();
    orderSelection.clear();
  };

  const viewInChat = (orderId: string) => {
    // Add single selection to chips bar for context
    addSelected({ id: orderId, label: orderId, type: 'order' });
    (openChatWithTopic as any)?.(
      'orders',
      orderId,
      updateOrder,
      orders,
      refreshOrders
    );
    if (!openChatWithTopic) openChat();
  };

  if (isLoading) {
    return (
      <div className="relative">
        <Card className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
            <Skeleton variant="text" width="120px" height="20px" />
          </div>
          <div className="divide-y divide-neutral-200">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Skeleton variant="circular" width="20px" height="20px" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton variant="text" width="80px" height="14px" />
                      <Skeleton variant="text" width="120px" height="16px" />
                      <div className="flex gap-2">
                        <Skeleton
                          variant="rectangular"
                          width="60px"
                          height="18px"
                        />
                        <Skeleton
                          variant="rectangular"
                          width="90px"
                          height="18px"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right space-y-1">
                      <Skeleton variant="text" width="70px" height="16px" />
                      <Skeleton variant="text" width="60px" height="14px" />
                    </div>
                    <Skeleton variant="circular" width="32px" height="32px" />
                  </div>
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
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-base font-semibold text-neutral-800">
            Recent Orders
          </span>
        </div>

        <div className="space-y-4 px-3 pb-3">
          {displayOrders.map(o => (
            <div
              key={o.id}
              className="relative rounded-2xl border bg-white/80 shadow-sm p-5 min-h-[96px]"
            >
              {/* Checkbox (hidden until selection mode) */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
                <Checkbox
                  checked={orderSelection.isSelected(o.id)}
                  onCheckedChange={() => toggleOrderSelection(o.id)}
                  className={cn(
                    'bg-white border-2 border-gray-300 w-5 h-5 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
                    orderSelection.selectionCount > 0
                      ? 'opacity-100'
                      : 'opacity-0'
                  )}
                />
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-5 pl-6">
                {/* Left grid: 5 stacked rows */}
                <div className="min-w-0 space-y-1.5">
                  {/* Row 1: order id */}
                  <div className="text-[13px] sm:text-sm text-neutral-500">
                    {o.id}
                  </div>
                  {/* Row 2: name */}
                  <div className="text-[14px] sm:text-base font-semibold text-neutral-900">
                    {o.customer}
                  </div>
                  {/* Row 3: badges */}
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    {o.priority && (
                      <Badge
                        size="sm"
                        variant="error"
                        className="text-[11px] whitespace-nowrap"
                      >
                        {o.priority}
                      </Badge>
                    )}
                    <Badge
                      size="sm"
                      variant={getOrderStatusBadgeVariant(o.status)}
                      className="text-[11px] whitespace-nowrap"
                    >
                      {o.status}
                    </Badge>
                  </div>
                  {/* Row 4: price */}
                  <div className="text-[15px] sm:text-base font-semibold">
                    {o.total}
                  </div>
                  {/* Row 5: date */}
                  <div className="text-[12px] sm:text-sm text-neutral-500">
                    {o.date}
                  </div>
                </div>

                {/* Right: three-dot overflow (trigger + menu) */}
                <div className="flex justify-end relative">
                  <MobileCardMenu
                    isOpen={openMenuId === o.id}
                    onToggle={() =>
                      setOpenMenuId(prev => (prev === o.id ? null : o.id))
                    }
                    actions={[
                      {
                        label: 'View in Chat',
                        onClick: () => viewInChat(o.id),
                      },
                      {
                        label: orderSelection.isSelected(o.id)
                          ? 'Unselect'
                          : 'Select',
                        onClick: () => toggleOrderSelection(o.id),
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pagination outside the card container */}
      <div className="px-4 pt-2 pb-24">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={orders.length}
          onPageChange={setPage}
        />
      </div>

      {/* Floating Add to Chat button */}
      {orderSelection.selectionCount > 0 && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={addSelectedToChat}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-6 py-3 flex items-center gap-2 min-h-[56px] text-sm"
          >
            <Plus className="w-5 h-5" />
            Add to Chat ({orderSelection.selectionCount})
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrdersCard;
