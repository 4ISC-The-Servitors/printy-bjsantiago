import React from 'react';
import { Card, Pagination } from '../../shared';
import { useQuotesCard } from '../../../hooks/admin/useQuotesCard';
import { QuoteItem } from './QuoteItem';
import QuotesSkeleton from './QuotesSkeleton';
import { useResponsiveLayout } from '../../../hooks/ui';
import type { AdminQuoteRow } from '../../../hooks/admin/useAdminQuotes';

export interface QuotesCardProps {
  filteredQuotes: AdminQuoteRow[];
}

const QuotesCard: React.FC<QuotesCardProps> = ({ filteredQuotes }) => {
  // All hooks must be called unconditionally before any early returns
  useResponsiveLayout();
  const {
    isLoading,
    page,
    setPage,
    pageSize,
    setHoveredQuoteId,
  } = useQuotesCard();

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
    return <QuotesSkeleton />;
  }

  return (
    <div className="relative">
      <Card className="p-0">
        {/* Pagination Header */}
        <div className="flex items-center justify-center px-1 py-1 sm:px-1 sm:py-1">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filteredQuotes.length}
            onPageChange={setPage}
          />
        </div>

        {/* Quotes List */}
        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 py-4">
          {displayQuotes.length > 0 ? (
            displayQuotes.map(quote => (
              <QuoteItem
                key={quote.id}
                quote={quote}
                onHover={setHoveredQuoteId}
              />
            ))
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <p className="text-lg font-medium">No quotes found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default QuotesCard;
