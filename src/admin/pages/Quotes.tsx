// Admin Quotes page - AI-powered quote management with real-time subscriptions
import React from 'react';
import { QuotesCard } from '@admin/components';
import { Search, Filter, Card, Text } from '@shared/components';
import { QuotesProvider } from '@admin/hooks/QuotesContext';
import { useGenericSearchFilter } from '@shared/hooks/ui/useGenericSearchFilter';
import {
  useResponsiveClasses,
  useDeviceUtils,
} from '@shared/hooks/ui/useResponsiveClasses';
import { FILTER_CONFIGS } from '@shared/types/filters';
import { useAdminQuotes } from '@admin/hooks/useAdminQuotes';

const QuotesContent: React.FC = () => {
  const {
    quotes: quotesAll,
    hasMore,
    loadAll,
    loadingAll,
    loadMore,
    loading,
    loadingMore,
    refresh,
    totalCount,
  } = useAdminQuotes();

  // Responsive hooks
  const { spacingClasses } = useResponsiveClasses();
  const { isMobile } = useDeviceUtils();

  // Search + Filter logic using generic search filter
  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredQuotes,
  } = useGenericSearchFilter({
    items: quotesAll,
    searchFields: [
      'id',
      'display_id',
      'product_name',
      'customer_name',
      'customer_email',
      'status',
      'quoted_amount',
      'created_at',
      'updated_at',
      'ended_at',
    ],
    dateField: 'updated_at',
    filterConfig: FILTER_CONFIGS.quotes,
    statusField: 'status',
  });

  const hasStatusFilter = Boolean(filter.statuses?.length);
  const hasRoleFilter = Boolean(filter.roles?.length);
  const hasDateFilter = Boolean(filter.dateFrom || filter.dateTo);
  const hasSearch = Boolean(search.trim());

  React.useEffect(() => {
    if (!hasMore || loadingAll) return;
    if (hasStatusFilter || hasRoleFilter || hasDateFilter || hasSearch) {
      void loadAll();
    }
  }, [
    hasMore,
    loadAll,
    loadingAll,
    hasStatusFilter,
    hasRoleFilter,
    hasDateFilter,
    hasSearch,
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
              filterConfig={FILTER_CONFIGS.quotes}
              showResultCount={false}
              resultCount={filteredQuotes.length}
              floating={true}
            />
          </div>

          {/* Search Bar - Takes remaining space */}
          <div className="flex-1 min-w-0">
            <Search
              value={search}
              onChange={v => setSearch(v)}
              placeholder="Search by quote ID, customer, product, or amount..."
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
              {filteredQuotes.length}
            </span>{' '}
            {filteredQuotes.length === 1 ? 'quote' : 'quotes'}
          </div>
        )}
      </div>

      {/* Quotes List / Empty State */}
      {filteredQuotes.length === 0 ? (
        <Card className="p-8 text-center">
          <Text variant="p" className="text-neutral-500">
            {quotesAll.length === 0
              ? 'No quotes found.'
              : 'No quotes match your filters.'}
          </Text>
        </Card>
      ) : (
        <QuotesCard
          filteredQuotes={filteredQuotes}
          allQuotes={quotesAll}
          hasMore={hasMore}
          loadMore={loadMore}
          loading={loading}
          loadingMore={loadingMore}
          refreshQuotes={refresh}
          totalCount={totalCount}
        />
      )}
    </div>
  );
};

const AdminQuotes: React.FC = () => {
  return (
    <QuotesProvider>
      <QuotesContent />
    </QuotesProvider>
  );
};

export default AdminQuotes;
