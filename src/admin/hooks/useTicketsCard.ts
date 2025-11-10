import React, { useState, useMemo } from 'react';
import { useAdmin } from './AdminContext';
import useResponsivePageSize from '@shared/hooks/ui/useResponsivePageSize';

interface UseTicketsCardOptions {
  allTickets: any[];
  filteredTickets: any[];
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loading: boolean;
  loadingMore: boolean;
  loadingAll: boolean;
  refreshTickets: () => void;
}

export const useTicketsCard = (
  {
    allTickets,
    filteredTickets,
    hasMore,
    loadMore,
    loading,
    loadingMore,
    loadingAll,
    refreshTickets,
  }: UseTicketsCardOptions,
  overridePageSize?: number
) => {
  const { openChatWithTopic, openChat } = useAdmin();
  const [hoveredTicketId, setHoveredTicketId] = useState<string | null>(null);

  const isLoading = loading || loadingAll;

  const dynamicPageSize = useResponsivePageSize({
    useDynamicCalculation: true,
    itemHeight: 140,
    itemSpacing: 24,
    headerOffset: 200,
    footerOffset: 100,
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

  React.useEffect(() => {
    const endIndex = page * pageSize;
    if (
      hasMore &&
      !loading &&
      !loadingMore &&
      !loadingAll &&
      filteredTickets.length < endIndex
    ) {
      void loadMore();
    }
  }, [
    page,
    pageSize,
    filteredTickets.length,
    hasMore,
    loadMore,
    loading,
    loadingMore,
    loadingAll,
  ]);

  const viewInChat = (ticketId: string) => {
    if (openChatWithTopic) {
      openChatWithTopic(
        'tickets',
        ticketId,
        undefined,
        allTickets,
        refreshTickets
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
    hoveredTicketId,
    setHoveredTicketId,
    viewInChat,
  };
};
