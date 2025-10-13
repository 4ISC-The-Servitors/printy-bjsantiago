import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '../../shared';
import { useQuotes } from '../../../hooks/admin/QuotesContext';
import { useAdmin } from '../../../hooks/admin/AdminContext';
import QuoteItem from './QuoteItem';
import QuotesSkeleton from './QuotesSkeleton';

const ITEMS_PER_PAGE = 10;

const QuotesCard: React.FC = () => {
  const { quotes, loading: isLoading, error } = useQuotes();
  const { openChat, openChatWithTopic } = useAdmin();
  
  // Local state for pagination and UI interactions
  const [page, setPage] = useState(1);
  const [hoveredQuoteId, setHoveredQuoteId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set());

  // Pagination logic
  const displayQuotes = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return quotes.slice(start, start + ITEMS_PER_PAGE);
  }, [quotes, page]);

  const hasMore = quotes.length > page * ITEMS_PER_PAGE;

  // Selection handlers
  const isSelected = (quoteId: string) => selectedQuotes.has(quoteId);
  
  const toggleQuoteSelection = (quoteId: string) => {
    setSelectedQuotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(quoteId)) {
        newSet.delete(quoteId);
      } else {
        newSet.add(quoteId);
      }
      return newSet;
    });
  };

  // Chat handlers
  const viewInChat = (quoteId: string) => {
    if (openChatWithTopic) {
      openChatWithTopic('quotes', quoteId, undefined, quotes);
    } else {
      openChat();
    }
  };

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
              {quotes.length}
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
                showCheckbox={selectedQuotes.size > 0}
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
