import { useState, useMemo } from 'react';
import { useAdmin } from './AdminContext';
import { useAdminQuotes } from './useAdminQuotes';
import useResponsivePageSize from '@hooks/ui/useResponsivePageSize';

export const useQuotesCard = (overridePageSize?: number) => {
  const { openChatWithTopic, openChat } = useAdmin();
  const { quotes, loading: quotesLoading, refresh: refreshQuotes } = useAdminQuotes();
  const [hoveredQuoteId, setHoveredQuoteId] = useState<string | null>(null);

  // Use the loading state from the admin quotes hook
  const isLoading = quotesLoading;

  // Pagination with dynamic viewport-based calculation
  const dynamicPageSize = useResponsivePageSize({
    useDynamicCalculation: true,
    itemHeight: 140, // Approximate height of QuoteItem card
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

  const viewInChat = (quoteId: string) => {
    // Find the quote to get the session_id for navigation
    const quote = quotes.find(q => q.id === quoteId);
    const sessionId = quote?.session_id || quoteId;

    if (openChatWithTopic) {
      openChatWithTopic('quotes', sessionId, undefined, quotes, refreshQuotes);
    } else {
      openChat();
    }
  };

  return {
    isLoading,
    page,
    setPage,
    pageSize,
    hoveredQuoteId,
    setHoveredQuoteId,
    viewInChat,
  };
};