import React from 'react';
import { Card, Badge, Button } from '../../shared';
import { useQuotesCard } from '../../../hooks/admin/useQuotesCard';
import QuoteItem from './QuoteItem';
import QuotesSkeleton from './QuotesSkeleton';

const QuotesCard: React.FC = () => {
  const {
    isLoading,
    error,
    displayQuotes,
    page,
    setPage,
    hasMore,
    hoveredQuoteId,
    setHoveredQuoteId,
    openMenuId,
    setOpenMenuId,
    isSelected,
    selectionCount,
    toggleQuoteSelection,
    viewInChat,
  } = useQuotesCard();

  if (isLoading) {
    return <QuotesSkeleton />;
  }

  return (
    <div className="relative">
      <Card className="p-0">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4">
          <div className="text-xs text-neutral-500">Page {page}</div>
          <div className="flex items-center gap-2 text-neutral-500 text-xs">
            <Badge size="sm" variant="secondary">
              {displayQuotes.length}
            </Badge>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
          {error && <div className="p-4 text-sm text-error-600">{error}</div>}
          {!error && displayQuotes.length === 0 && (
            <div className="p-4 text-sm text-neutral-500">
              No quote conversations found.
            </div>
          )}
          {!error &&
            displayQuotes.map(quote => (
              <QuoteItem
                key={quote.conversation_id}
                quote={quote}
                isSelected={isSelected(quote.conversation_id)}
                isHovered={hoveredQuoteId === quote.conversation_id}
                showCheckbox={selectionCount > 0}
                openMenuId={openMenuId}
                onHover={setHoveredQuoteId}
                onToggleSelection={toggleQuoteSelection}
                onViewInChat={viewInChat}
                onToggleMenu={setOpenMenuId}
              />
            ))}
        </div>
      </Card>

      {/* Pagination controls */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={page === 1 || isLoading}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!hasMore || isLoading}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default QuotesCard;
