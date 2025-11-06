import React, { useMemo, useState, useEffect } from 'react';
import { useAdminConversations } from '@admin/hooks/useAdminConversations';
import {
  Card,
  Text,
  Pagination,
  Search,
  Filter,
} from '@shared/components';
import { useResponsivePageSize } from '@shared/hooks/ui/useResponsivePageSize';
import { useGenericSearchFilter } from '@shared/hooks/ui/useGenericSearchFilter';
import { useResponsiveClasses, useDeviceUtils } from '@shared/hooks/ui/useResponsiveClasses';
import HistoryItemCard from '@customer/components/shared/cards/HistoryItemCard';
import type { FilterConfig } from '@shared/types/filters';

const AdminChatsPage: React.FC = () => {
  const { conversations, setActive } = useAdminConversations();
  const { spacingClasses } = useResponsiveClasses();
  const { isMobileOrTablet } = useDeviceUtils();

  const sorted = useMemo(
    () => conversations.slice().sort((a, b) => b.createdAt - a.createdAt),
    [conversations]
  );

  // Filter configuration for chat conversations
  const filterConfig: FilterConfig = {
    showDateRange: true,
    showStatusFilter: true,
    showRoleFilter: false,
    statusOptions: [
      { label: 'Active', value: 'active' },
      { label: 'Ended', value: 'ended' },
    ],
  };

  // Use the generic search filter hook
  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: allFilteredConversations,
  } = useGenericSearchFilter({
    items: sorted,
    searchFields: ['title', 'id'],
    dateField: 'createdAt',
    filterConfig,
    statusField: 'status',
  });

  const pageSize = useResponsivePageSize({
    itemHeight: 120,
    itemSpacing: 24,
    headerOffset: 200,
    footerOffset: 80,
    minItems: 2,
    maxItems: 20,
    useDynamicCalculation: true,
  });

  const [page, setPage] = useState(1);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const total = allFilteredConversations.length;
  const start = (page - 1) * pageSize;
  const pageItems = allFilteredConversations.slice(start, start + pageSize);

  const handleOpen = (id: string) => {
    setActive(id);
    // Dispatch event to open the conversation in the chat dock
    window.dispatchEvent(
      new CustomEvent('admin-show-conversation', {
        detail: { conversationId: id },
      })
    );
  };

  return (
    <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 space-y-4 sm:space-y-5 md:space-y-6">
      {/* Page Title */}
      <div>
        <Text
          variant="h1"
          size="xl"
          weight="bold"
          className="device-text-heading text-neutral-900 mb-5"
        >
          All Chats
        </Text>
        <Text variant="p" size="sm" color="muted">
          Recent conversations across admin assistants
        </Text>
      </div>

      {/* Search and Filter Section */}
      <div className="relative mb-6 sm:mb-8">
        {/* Filter and Search Row - Always horizontal layout with responsive spacing */}
        <div className={`flex items-center ${spacingClasses.gap}`}>
          {/* Filter Component - Floating mode */}
          <div className={`${isMobileOrTablet ? 'w-24' : 'w-auto'} shrink-0`}>
            <Filter
              value={filter}
              onChange={v => setFilter(v)}
              filterConfig={filterConfig}
              showResultCount={false}
              resultCount={allFilteredConversations.length}
              floating={true}
            />
          </div>

          {/* Search Bar - Takes remaining space */}
          <div className="flex-1 min-w-0">
            <Search
              value={search}
              onChange={v => setSearch(v)}
              placeholder="Search conversations..."
              size="lg"
            />
          </div>
        </div>

        {/* Result Count */}
        {(filter.statuses?.length > 0 ||
          filter.dateFrom ||
          filter.dateTo ||
          search.trim()) && (
          <div className="text-sm text-neutral-600 mt-4">
            Found{' '}
            <span className="font-semibold text-neutral-900">
              {allFilteredConversations.length}
            </span>{' '}
            {allFilteredConversations.length === 1
              ? 'conversation'
              : 'conversations'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="mt-6">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Conversation List */}
      <div className="space-y-4">
        {pageItems.map(conversation => (
          <HistoryItemCard
            key={conversation.id}
            type="chat"
            displayId={conversation.title}
            title=""
            status={conversation.status}
            createdAt={conversation.createdAt}
            updatedAt={conversation.endedAt || conversation.createdAt}
            onClick={() => handleOpen(conversation.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {total === 0 && (
        <Card className="p-8 text-center">
          <Text variant="p" className="text-neutral-500">
            {sorted.length === 0
              ? 'No chats found.'
              : 'No chats match your filters.'}
          </Text>
        </Card>
      )}
    </div>
  );
};

export default AdminChatsPage;
