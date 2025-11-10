import React, { useEffect, useRef, useState } from 'react';
import { Card, Pagination } from '@admin/components/shared';
import { AdminListSkeleton } from '@shared/components/feedback';
import { useOrdersCard } from '@admin/hooks/useOrdersCard';
import { usePersistentUnread } from '@admin/hooks/usePersistentUnread';
import { OrderItem } from './OrderItem';
import { useResponsiveLayout } from '@shared/hooks';
import type { AdminOrderRow } from '@admin/hooks/useAdminOrders';
import { supabase } from '@lib/supabase';

export interface OrdersCardProps {
  filteredOrders: AdminOrderRow[];
  allOrders: AdminOrderRow[];
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loading: boolean;
  loadingMore: boolean;
  refreshOrders: () => void;
  totalCount?: number;
}

const OrdersCard: React.FC<OrdersCardProps> = ({
  filteredOrders,
  allOrders,
  hasMore,
  loadMore,
  loading,
  loadingMore,
  refreshOrders,
  totalCount,
}) => {
  // All hooks must be called unconditionally before any early returns
  useResponsiveLayout();
  const { isHydrated, hasViewed, markAsViewed, markManyAsViewed } =
    usePersistentUnread({
      storageKey: 'admin:viewed-orders',
    });
  const { isLoading, page, setPage, pageSize, setHoveredOrderId, viewInChat } =
    useOrdersCard({
      allOrders,
      filteredOrders,
      hasMore,
      loadMore,
      loading,
      loadingMore,
      refreshOrders,
    });

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setCurrentUserId(data.user?.id ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      seededRef.current ||
      !isHydrated ||
      loading ||
      loadingMore ||
      allOrders.length === 0
    ) {
      return;
    }

    markManyAsViewed(
      allOrders.map(order => ({
        id: order.id,
        version: order.updated_at ?? order.created_at ?? null,
      }))
    );
    seededRef.current = true;
  }, [allOrders, isHydrated, loading, loadingMore, markManyAsViewed]);

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
    return (
      <AdminListSkeleton itemCount={5} showCheckbox={true} showAction={true} />
    );
  }

  return (
    <div className="relative">
      <Card className="p-0">
        {/* Pagination Header */}
        <div className="flex items-center justify-center px-1 py-1 sm:px-1 sm:py-1">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={
              typeof totalCount === 'number' && totalCount > 0
                ? totalCount
                : filteredOrders.length
            }
            onPageChange={setPage}
          />
        </div>

        {/* Orders List */}
        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 py-4">
          {displayOrders.length > 0 ? (
            displayOrders.map(order => {
              const version = order.updated_at ?? order.created_at ?? null;
              const isSelfUpdate = Boolean(
                currentUserId &&
                  order.updated_by &&
                  order.updated_by === currentUserId
              );
              const isUnread = !isSelfUpdate && !hasViewed(order.id, version);

              return (
                <OrderItem
                  key={order.id}
                  order={order}
                  onHover={setHoveredOrderId}
                  onViewInChat={viewInChat}
                  isUnread={isUnread}
                  onMarkViewed={markAsViewed}
                  currentUserId={currentUserId}
                />
              );
            })
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
