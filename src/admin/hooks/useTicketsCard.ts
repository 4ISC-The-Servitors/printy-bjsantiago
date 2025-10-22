import { useState, useMemo } from 'react';
import { useAdmin } from './AdminContext';
import { useTickets } from './TicketsContext';
import useResponsivePageSize from '@shared/hooks/ui/useResponsivePageSize';

export const useTicketsCard = (overridePageSize?: number) => {
  const { openChat, openChatWithTopic } = useAdmin();
  const [hoveredTicketId, setHoveredTicketId] = useState<string | null>(null);

  // Get loading state from TicketsContext instead of making a wasteful DB call
  const { loading: isLoading, error } = useTickets();

  // Pagination with dynamic viewport-based calculation
  const dynamicPageSize = useResponsivePageSize({
    useDynamicCalculation: true,
    itemHeight: 140, // Approximate height of TicketItem card
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

  const viewInChat = (ticketId: string, allTickets?: any[]) => {
    if (openChatWithTopic) {
      // Pass the actual inquiry records to ensure the chat flow has access to the full inquiry data
      openChatWithTopic('tickets', ticketId, undefined, allTickets);
    } else {
      openChat();
    }
  };

  return {
    isLoading,
    error,
    page,
    setPage,
    pageSize,
    hoveredTicketId,
    setHoveredTicketId,
    viewInChat,
  };
};
