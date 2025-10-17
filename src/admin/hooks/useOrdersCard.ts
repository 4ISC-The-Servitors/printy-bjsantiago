import { useState, useMemo } from 'react';
import { useAdmin } from './AdminContext';
import { useOrders } from './OrdersContext';
import useResponsivePageSize from '@shared/hooks/ui/useResponsivePageSize';

export const useOrdersCard = (overridePageSize?: number) => {
  const { openChatWithTopic, openChat } = useAdmin();
  const { orders, updateOrder, refreshOrders, loading: ordersLoading } = useOrders();
  const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);

  // Use the loading state from the orders context
  const isLoading = ordersLoading;

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

  const viewInChat = (orderId: string) => {
    if (openChatWithTopic) {
      openChatWithTopic('orders', orderId, updateOrder, orders, refreshOrders);
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
