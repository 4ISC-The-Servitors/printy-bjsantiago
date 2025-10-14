import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from './AdminContext';
import { useOrders } from './OrdersContext';
import useResponsivePageSize from '../ui/useResponsivePageSize';

export const useOrdersCard = (overridePageSize?: number) => {
  const { openChatWithTopic, openChat, addSelected } = useAdmin();
  const { orders, updateOrder, refreshOrders, loading: ordersLoading } = useOrders();
  const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);

  // Use the loading state from the orders context
  const isLoading = ordersLoading;

  // Pagination with dynamic viewport-based calculation
  const dynamicPageSize = useResponsivePageSize({
    useDynamicCalculation: true,
    itemHeight: 140, // Approximate height of OrderItem card
    itemSpacing: 24, // space-y-6 = 24px between items
    headerOffset: 140, // Admin navbar + card header + padding
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

  const start = (page - 1) * pageSize;
  const displayOrders = orders.slice(start, start + pageSize);

  // Clamp page when page size changes
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [pageSize, orders.length, page]);



  const viewInChat = (orderId: string) => {
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

  return {
    isLoading,
    displayOrders,
    page,
    setPage,
    pageSize,
    totalOrders: orders.length,
    hoveredOrderId,
    setHoveredOrderId,
    viewInChat,
  };
};
