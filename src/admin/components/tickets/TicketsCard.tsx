import React, { useEffect, useRef, useState } from 'react';
import { Card, Pagination } from '@admin/components/shared';
import { AdminListSkeleton } from '@shared/components/feedback';
import { useTicketsCard } from '@admin/hooks/useTicketsCard';
import { usePersistentUnread } from '@admin/hooks/usePersistentUnread';
import { TicketItem } from './TicketItem';
import { useResponsiveLayout } from '@shared/hooks/ui';
import { supabase } from '@lib/supabase';

export interface TicketsCardProps {
  filteredTickets: any[];
  allTickets: any[];
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loading: boolean;
  loadingMore: boolean;
  loadingAll: boolean;
  refreshTickets: () => void;
  totalCount?: number;
}

const TicketsCard: React.FC<TicketsCardProps> = ({
  filteredTickets,
  allTickets,
  hasMore,
  loadMore,
  loading,
  loadingMore,
  loadingAll,
  refreshTickets,
  totalCount,
}) => {
  // All hooks must be called unconditionally before any early returns
  useResponsiveLayout();
  const { isHydrated, hasViewed, markAsViewed, markManyAsViewed } =
    usePersistentUnread({
      storageKey: 'admin:viewed-tickets',
    });
  const { isLoading, page, setPage, pageSize, viewInChat } = useTicketsCard({
    allTickets,
    filteredTickets,
    hasMore,
    loadMore,
    loading,
    loadingMore,
    loadingAll,
    refreshTickets,
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
      loadingAll ||
      allTickets.length === 0
    ) {
      return;
    }

    markManyAsViewed(
      allTickets.map(ticket => ({
        id: ticket.inquiry_id,
        version: ticket.updated_at ?? ticket.received_at ?? null,
      }))
    );
    seededRef.current = true;
  }, [
    allTickets,
    isHydrated,
    loading,
    loadingAll,
    loadingMore,
    markManyAsViewed,
  ]);

  // Calculate paginated display tickets from filtered tickets
  const start = (page - 1) * pageSize;
  const displayInquiries = filteredTickets.slice(start, start + pageSize);

  // Reset to page 1 if current page exceeds available pages
  React.useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredTickets.length, pageSize, page, setPage]);

  // Now we can do early return for loading state
  if (isLoading) {
    return (
      <AdminListSkeleton itemCount={5} showCheckbox={true} showAction={true} />
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
                : filteredTickets.length
            }
            onPageChange={setPage}
          />
        </div>

        {/* Tickets List */}
        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 py-4">
          {displayInquiries.length > 0 ? (
            displayInquiries.map(ticket => {
              const version = ticket.updated_at ?? ticket.received_at ?? null;
              const isSelfUpdate = Boolean(
                currentUserId &&
                  ticket.updated_by &&
                  ticket.updated_by === currentUserId
              );
              const isUnread =
                !isSelfUpdate && !hasViewed(ticket.inquiry_id, version);

              return (
                <TicketItem
                  key={ticket.inquiry_id}
                  ticket={ticket}
                  onViewInChat={viewInChat}
                  isUnread={isUnread}
                  onMarkViewed={markAsViewed}
                  currentUserId={currentUserId}
                />
              );
            })
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <p className="text-lg font-medium">No tickets found</p>
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

export default TicketsCard;
