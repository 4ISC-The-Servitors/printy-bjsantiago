import React from 'react';
import { Card, Badge, Button } from '../../shared';
import { useTicketsCard } from '../../../hooks/admin/useTicketsCard';
import { TicketItem } from './TicketItem';
import { TicketsSkeleton } from './TicketsSkeleton';

const TicketsCard: React.FC = () => {
  const {
    isLoading,
    error,
    displayInquiries,
    page,
    setPage,
    hasMore,
    hoveredTicketId,
    setHoveredTicketId,
    isSelected,
    selectionCount,
    toggleTicketSelection,
    viewInChat,
  } = useTicketsCard();

  if (isLoading) {
    return <TicketsSkeleton />;
  }

  return (
    <div className="relative">
      <Card className="p-0">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4">
          <div className="text-xs text-neutral-500">Page {page}</div>
          <div className="flex items-center gap-2 text-neutral-500 text-xs">
            <Badge size="sm" variant="secondary">
              {displayInquiries.length}
            </Badge>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
          {error && <div className="p-4 text-sm text-error-600">{error}</div>}
          {!error && displayInquiries.length === 0 && (
            <div className="p-4 text-sm text-neutral-500">
              No inquiries found.
            </div>
          )}
          {!error &&
            displayInquiries.map(ticket => (
              <TicketItem
                key={ticket.inquiry_id}
                ticket={ticket}
                isSelected={isSelected(ticket.inquiry_id)}
                isHovered={hoveredTicketId === ticket.inquiry_id}
                showCheckbox={selectionCount > 0}
                onHover={setHoveredTicketId}
                onToggleSelection={toggleTicketSelection}
                onViewInChat={viewInChat}
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

export default TicketsCard;
