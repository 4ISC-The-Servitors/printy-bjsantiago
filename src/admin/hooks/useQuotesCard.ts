import React, { useState, useMemo } from 'react';
import { useAdmin } from './AdminContext';
import useResponsivePageSize from '@shared/hooks/ui/useResponsivePageSize';
import type { AdminQuoteRow } from './useAdminQuotes';

interface UseQuotesCardOptions {
  allQuotes: AdminQuoteRow[];
  filteredQuotes: AdminQuoteRow[];
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loading: boolean;
  loadingMore: boolean;
  refreshQuotes: () => void;
}

export const useQuotesCard = (
  {
    allQuotes,
    filteredQuotes,
    hasMore,
    loadMore,
    loading,
    loadingMore,
    refreshQuotes,
  }: UseQuotesCardOptions,
  overridePageSize?: number
) => {
  const { openChatWithTopic, openChat } = useAdmin();
  const [hoveredQuoteId, setHoveredQuoteId] = useState<string | null>(null);

  const isLoading = loading;

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
      filteredQuotes.length < endIndex
    ) {
      void loadMore();
    }
  }, [
    page,
    pageSize,
    filteredQuotes.length,
    hasMore,
    loadMore,
    loading,
    loadingMore,
  ]);

  const viewInChat = (quoteId: string) => {
    const quote = allQuotes.find(q => q.id === quoteId);
    const sessionId = quote?.session_id || quoteId;

    if (openChatWithTopic) {
      openChatWithTopic(
        'quotes',
        sessionId,
        undefined,
        allQuotes,
        refreshQuotes
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
    hoveredQuoteId,
    setHoveredQuoteId,
    viewInChat,
  };
};
