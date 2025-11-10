import React, { useEffect, useRef, useState } from 'react';
import { Card, Pagination } from '@admin/components/shared';
import { AdminListSkeleton } from '@shared/components/feedback';
import { useQuotesCard } from '@admin/hooks/useQuotesCard';
import { usePersistentUnread } from '@admin/hooks/usePersistentUnread';
import { QuoteItem } from './QuoteItem';
import { useResponsiveLayout } from '@shared/hooks/ui';
import type { AdminQuoteRow } from '@admin/hooks/useAdminQuotes';
import { supabase } from '@lib/supabase';

export interface QuotesCardProps {
  filteredQuotes: AdminQuoteRow[];
  allQuotes: AdminQuoteRow[];
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loading: boolean;
  loadingMore: boolean;
  refreshQuotes: () => void;
  totalCount?: number;
}

const QuotesCard: React.FC<QuotesCardProps> = ({
  filteredQuotes,
  allQuotes,
  hasMore,
  loadMore,
  loading,
  loadingMore,
  refreshQuotes,
  totalCount,
}) => {
  // All hooks must be called unconditionally before any early returns
  useResponsiveLayout();
  const { isHydrated, hasViewed, markAsViewed, markManyAsViewed } =
    usePersistentUnread({
      storageKey: 'admin:viewed-quotes',
    });
  const { isLoading, page, setPage, pageSize, setHoveredQuoteId, viewInChat } =
    useQuotesCard({
      allQuotes,
      filteredQuotes,
      hasMore,
      loadMore,
      loading,
      loadingMore,
      refreshQuotes,
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
      allQuotes.length === 0
    ) {
      return;
    }

    markManyAsViewed(
      allQuotes.map(quote => ({
        id: quote.session_id || quote.id,
        version: quote.updated_at ?? quote.created_at ?? null,
      }))
    );
    seededRef.current = true;
  }, [allQuotes, isHydrated, loading, loadingMore, markManyAsViewed]);

  // Calculate paginated display quotes from filtered quotes
  const start = (page - 1) * pageSize;
  const displayQuotes = filteredQuotes.slice(start, start + pageSize);

  // Reset to page 1 if current page exceeds available pages
  React.useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredQuotes.length / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredQuotes.length, pageSize, page, setPage]);

  // Now we can do early return for loading state
  if (isLoading) {
    return (
      <AdminListSkeleton itemCount={5} showCheckbox={false} showAction={true} />
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
                : filteredQuotes.length
            }
            onPageChange={setPage}
          />
        </div>

        {/* Quotes List */}
        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 py-4">
          {displayQuotes.length > 0 ? (
            displayQuotes.map(quote => {
              const identifier = quote.session_id || quote.id;
              const version = quote.updated_at ?? quote.created_at ?? null;
              const isSelfUpdate = Boolean(
                currentUserId &&
                  quote.updated_by &&
                  quote.updated_by === currentUserId
              );
              const isUnread = !isSelfUpdate && !hasViewed(identifier, version);

              return (
                <QuoteItem
                  key={quote.id}
                  quote={quote}
                  onHover={setHoveredQuoteId}
                  onViewInChat={viewInChat}
                  isUnread={isUnread}
                  onMarkViewed={markAsViewed}
                  currentUserId={currentUserId}
                />
              );
            })
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <p className="text-lg font-medium">No quotes found</p>
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

export default QuotesCard;
