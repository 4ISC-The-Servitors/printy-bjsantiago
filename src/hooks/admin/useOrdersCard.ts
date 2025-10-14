import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from './AdminContext';
import { useOrders } from './OrdersContext';
import useResponsivePageSize from '../ui/useResponsivePageSize';

export const useOrdersCard = () => {
  const { openChatWithTopic, openChat, addSelected } = useAdmin();
  const { orders, updateOrder, refreshOrders, loading: ordersLoading } = useOrders();
  const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);

  // Use the loading state from the orders context
  const isLoading = ordersLoading;

  // Pagination
  const basePageSize = useResponsivePageSize({
    phone: 2,
    tablet: 3,
    desktop: 4,
  });

  const [page, setPage] = useState(1);

  const pageSize = useMemo(() => {
    if (typeof window === 'undefined') return basePageSize;
    const viewportHeight = window.innerHeight;
    if (viewportHeight < 800 && basePageSize > 2) {
      return Math.max(2, basePageSize - 1);
    }
    return basePageSize;
  }, [basePageSize]);

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
