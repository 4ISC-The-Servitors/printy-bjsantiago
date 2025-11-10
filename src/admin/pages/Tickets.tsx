// Admin tickets page with real-time subscriptions
import React from 'react';
import { TicketsCard } from '@admin/components';
import { Search, Filter, Card, Text } from '@shared/components';
import { useGenericSearchFilter } from '@shared/hooks/ui/useGenericSearchFilter';
import {
  useResponsiveClasses,
  useDeviceUtils,
} from '@shared/hooks/ui/useResponsiveClasses';
import { FILTER_CONFIGS } from '@shared/types/filters';
import { useAdminTickets } from '@features/chat/hooks/admin/useAdminTickets';

const TicketsContent: React.FC = () => {
  const {
    tickets: ticketsAll,
    hasMore,
    loadMore,
    loadAll,
    loading,
    loadingMore,
    loadingAll,
    reload,
    totalCount,
  } = useAdminTickets({ useAdvancedFallbacks: false });

  // Responsive hooks
  const { spacingClasses } = useResponsiveClasses();
  const { isMobile } = useDeviceUtils();

  // Search + Filter logic using generic search filter
  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredTickets,
  } = useGenericSearchFilter({
    items: ticketsAll,
    searchFields: [
      'inquiry_id',
      'display_id',
      'inquiry_type',
      'inquiry_status',
      'customer_full_name',
      'customer_first_name',
      'customer_last_name',
      'updated_at',
      'order_id',
    ],
    dateField: 'updated_at',
    filterConfig: FILTER_CONFIGS.tickets,
    statusField: 'inquiry_status',
  });

  const hasStatusFilter = Boolean(filter.statuses?.length);
  const hasRoleFilter = Boolean(filter.roles?.length);
  const hasDateFilter = Boolean(filter.dateFrom || filter.dateTo);
  const hasSearch = Boolean(search.trim());

  // When searching/filtering, load all pages so client-side search can find old IDs
  React.useEffect(() => {
    if (!hasMore || loading || loadingMore || loadingAll) return;
    if (hasStatusFilter || hasRoleFilter || hasDateFilter || hasSearch) {
      void loadAll();
    }
  }, [
    hasMore,
    loading,
    loadingMore,
    loadingAll,
    hasStatusFilter,
    hasRoleFilter,
    hasDateFilter,
    hasSearch,
    loadAll,
  ]);

  return (
    <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
      {/* Floating Search and Filter Section */}
      <div className="relative mb-6 sm:mb-8">
        {/* Filter and Search Row - Always horizontal layout with responsive spacing */}
        <div className={`flex items-center ${spacingClasses.gap}`}>
          {/* Filter Component - Floating mode */}
          <div className={`${isMobile ? 'w-24' : 'w-auto'} shrink-0`}>
            <Filter
              value={filter}
              onChange={v => setFilter(v)}
              filterConfig={FILTER_CONFIGS.tickets}
              showResultCount={false}
              resultCount={filteredTickets.length}
              floating={true}
            />
          </div>

          {/* Search Bar - Takes remaining space */}
          <div className="flex-1 min-w-0">
            <Search
              value={search}
              onChange={v => setSearch(v)}
              placeholder="Search by ticket ID, type, status, or customer..."
              size="lg"
            />
          </div>
        </div>

        {/* Result Count */}
        {(filter.statuses?.length > 0 ||
          (filter.roles && filter.roles.length > 0) ||
          filter.dateFrom ||
          filter.dateTo ||
          search.trim()) && (
          <div className="text-sm text-neutral-600 mt-4">
            Found{' '}
            <span className="font-semibold text-neutral-900">
              {filteredTickets.length}
            </span>{' '}
            {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
          </div>
        )}
      </div>

      {/* Tickets List / Empty State */}
      {filteredTickets.length === 0 ? (
        <Card className="p-8 text-center">
          <Text variant="p" className="text-neutral-500">
            {ticketsAll.length === 0
              ? 'No tickets found.'
              : 'No tickets match your filters.'}
          </Text>
        </Card>
      ) : (
        <TicketsCard
          filteredTickets={filteredTickets}
          allTickets={ticketsAll}
          hasMore={hasMore}
          loadMore={loadMore}
          loading={loading}
          loadingMore={loadingMore}
          loadingAll={loadingAll}
          refreshTickets={reload}
          totalCount={totalCount}
        />
      )}
    </div>
  );
};

const AdminTickets: React.FC = () => {
  return <TicketsContent />;
};

export default AdminTickets;
