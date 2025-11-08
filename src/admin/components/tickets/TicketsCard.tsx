import React from 'react';
import { Card, Pagination } from '@admin/components/shared';
import { SimpleLoading } from '@shared/components/ui/SimpleLoading';
import { useTicketsCard } from '@admin/hooks/useTicketsCard';
import { TicketItem } from './TicketItem';
import { useResponsiveLayout } from '@shared/hooks/ui';

interface TicketsCardProps {
  filteredTickets?: any[];
}

const TicketsCard: React.FC<TicketsCardProps> = ({ filteredTickets }) => {
  // All hooks must be called unconditionally before any early returns
  useResponsiveLayout();
  const { isLoading, error, page, setPage, pageSize, viewInChat } =
    useTicketsCard();

  // Calculate paginated display tickets from filtered tickets
  const start = (page - 1) * pageSize;
  const displayInquiries =
    filteredTickets?.slice(start, start + pageSize) || [];

  // Reset to page 1 if current page exceeds available pages
  React.useEffect(() => {
    const maxPage = Math.max(
      1,
      Math.ceil((filteredTickets?.length || 0) / pageSize)
    );
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredTickets?.length, pageSize, page, setPage]);

  if (isLoading) {
    return <SimpleLoading text="Loading tickets..." />;
  }

  return (
    <div className="relative">
      <Card className="p-0">
        {/* Pagination Header */}
        <div className="flex items-center justify-center px-1 py-1 sm:px-1 sm:py-1">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filteredTickets?.length || 0}
            onPageChange={setPage}
          />
        </div>

        {/* Tickets List */}
        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 py-4">
          {error && <div className="p-4 text-sm text-error-600">{error}</div>}
          {!error && displayInquiries.length > 0 ? (
            displayInquiries.map(ticket => (
              <TicketItem
                key={ticket.inquiry_id}
                ticket={ticket}
                onViewInChat={ticketId => viewInChat(ticketId, filteredTickets)}
              />
            ))
          ) : !error ? (
            <div className="text-center py-12 text-neutral-500">
              <p className="text-lg font-medium">No tickets found</p>
              <p className="text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

export default TicketsCard;
