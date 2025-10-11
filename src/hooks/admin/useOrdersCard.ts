import { useState, useEffect, useMemo } from 'react';
import { useOrderSelection } from './SelectionContext';
import { createOrderSelectionItems } from '../../utils/admin/selectionUtils';
import { useAdmin } from './AdminContext';
import { useOrders } from './OrdersContext';
import useResponsivePageSize from '../ui/useResponsivePageSize';

export const useOrdersCard = () => {
  const orderSelection = useOrderSelection();
  const { openChatWithTopic, openChat, addSelected } = useAdmin();
  const { orders, updateOrder, refreshOrders } = useOrders();
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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

  const orderItems = useMemo(
    () => createOrderSelectionItems(displayOrders),
    [displayOrders]
  );

  const toggleOrderSelection = (orderId: string) => {
    const orderItem = orderItems.find(item => item.id === orderId);
    if (orderItem) {
      orderSelection.toggle(orderItem);
    }
  };

  const addSelectedToChat = () => {
    const selectedIds = orderSelection.selectedIds;
    if (selectedIds.length === 0) return;

    selectedIds.forEach(id => {
      addSelected({ id, label: id, type: 'order' });
    });

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
    openMenuId,
    setOpenMenuId,
    isSelected: orderSelection.isSelected,
    selectionCount: orderSelection.selectionCount,
    toggleOrderSelection,
    addSelectedToChat,
    viewInChat,
  };
};
