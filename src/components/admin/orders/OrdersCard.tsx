import React from 'react';
import { Card, Pagination } from '../../shared';
import { useOrdersCard } from '../../../hooks/admin/useOrdersCard';
import { OrderItem } from './OrderItem';
import { OrdersSkeleton } from './OrdersSkeleton';
import { useResponsiveLayout } from '../../../hooks/ui';

const OrdersCard: React.FC = () => {
  useResponsiveLayout();
  const {
    isLoading,
    displayOrders,
    page,
    setPage,
    pageSize,
    totalOrders,
    setHoveredOrderId,
    viewInChat,
  } = useOrdersCard();

  if (isLoading) {
    return <OrdersSkeleton />;
  }

  return (
    <div className="relative">
      <Card className="p-0">
        <div className={`flex items-center justify-end px-3 py-2 sm:px-4`}>
          <div className="flex items-center gap-2 text-neutral-500 text-xs"></div>
        </div>

        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
          {displayOrders.map(order => (
            <OrderItem
              key={order.id}
              order={order}
              onHover={setHoveredOrderId}
              onViewInChat={viewInChat}
            />
          ))}
        </div>
      </Card>

      {/* Pagination below the card list */}
      <div className="px-4 pt-3 pb-6">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalOrders}
          onPageChange={setPage}
        />
      </div>

    </div>
  );
};

export default OrdersCard;
