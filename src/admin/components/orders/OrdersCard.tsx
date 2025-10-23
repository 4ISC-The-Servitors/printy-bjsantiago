import React from 'react';
import { Card, Pagination } from '@admin/components/shared';
import { useOrdersCard } from '@admin/hooks/useOrdersCard';
import { OrderItem } from './OrderItem';
import { OrdersSkeleton } from './OrdersSkeleton';
import { useResponsiveLayout } from '@shared/hooks';
import type { AdminOrderRow } from '@admin/hooks/useAdminOrders';

export interface OrdersCardProps {
  filteredOrders: AdminOrderRow[];
}

const OrdersCard: React.FC<OrdersCardProps> = ({ filteredOrders }) => {
  // All hooks must be called unconditionally before any early returns
  useResponsiveLayout();
  const { isLoading, page, setPage, pageSize, setHoveredOrderId, viewInChat } =
    useOrdersCard();

  // Calculate paginated display orders from filtered orders
  const start = (page - 1) * pageSize;
  const displayOrders = filteredOrders.slice(start, start + pageSize);

  // Reset to page 1 if current page exceeds available pages
  React.useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredOrders.length, pageSize, page, setPage]);

  // Now we can do early return for loading state
  if (isLoading) {
    return <OrdersSkeleton />;
  }

  return (
    <div className="relative">
      <Card className="p-0">
        {/* Pagination Header */}
        <div className="flex items-center justify-center px-1 py-1 sm:px-1 sm:py-1">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filteredOrders.length}
            onPageChange={setPage}
          />
        </div>

        {/* Orders List */}
        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 py-4">
          {displayOrders.length > 0 ? (
            displayOrders.map(order => (
              <OrderItem
                key={order.id}
                order={order}
                onHover={setHoveredOrderId}
                onViewInChat={viewInChat}
              />
            ))
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default OrdersCard;
