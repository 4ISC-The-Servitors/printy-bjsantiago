import React, { useState, useMemo } from 'react';
import { useAdmin } from './AdminContext';
import useResponsivePageSize from '@shared/hooks/ui/useResponsivePageSize';
import type { AdminOrderRow } from './useAdminOrders';

interface UseOrdersCardOptions {
  allOrders: AdminOrderRow[];
  filteredOrders: AdminOrderRow[];
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loading: boolean;
  loadingMore: boolean;
  refreshOrders: () => void;
}

export const useOrdersCard = (
  {
    allOrders,
    filteredOrders,
    hasMore,
    loadMore,
    loading,
    loadingMore,
    refreshOrders,
  }: UseOrdersCardOptions,
  overridePageSize?: number
) => {
  const { openChatWithTopic, openChat } = useAdmin();
  const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);

  const isLoading = loading || loadingMore;

  // Pagination with dynamic viewport-based calculation
  const dynamicPageSize = useResponsivePageSize({
    useDynamicCalculation: true,
    itemHeight: 140, // Approximate height of OrderItem card
    itemSpacing: 24, // space-y-6 = 24px between items
    headerOffset: 200, // Admin navbar + search/filter section + card header
    footerOffset: 100, // Pagination + bottom padding
    minItems: 2,
    maxItems: 20,
    breakpoints: {
      phone: 2,
      tablet: 3,
      desktop: 4,
    },
  });

  const [page, setPage] = useState(1);

  const pageSize = useMemo(() => {
    if (overridePageSize && overridePageSize > 0) return overridePageSize;
    return dynamicPageSize;
  }, [dynamicPageSize, overridePageSize]);

  // Auto-load when user navigates past loaded slice
  React.useEffect(() => {
    const endIndex = page * pageSize;
    if (
      hasMore &&
      !loading &&
      !loadingMore &&
      filteredOrders.length < endIndex
    ) {
      void loadMore();
    }
  }, [
    page,
    pageSize,
    filteredOrders.length,
    hasMore,
    loadMore,
    loading,
    loadingMore,
  ]);

  const viewInChat = (orderId: string) => {
    if (openChatWithTopic) {
      const updateOrder = (_id: string, _updates: Partial<AdminOrderRow>) => {
        refreshOrders();
      };
      openChatWithTopic(
        'orders',
        orderId,
        updateOrder,
        allOrders,
        refreshOrders
      );
    } else {
      openChat();
    }
  };

  return {
    isLoading,
    page,
    setPage,
    pageSize,
    hoveredOrderId,
    setHoveredOrderId,
    viewInChat,
  };
};
