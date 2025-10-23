import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsivePageLayout from '@customer/components/shared/layouts/ResponsivePageLayout';
import HistoryItemCard from '@customer/components/shared/cards/HistoryItemCard';
import { Search, Filter, Button, Text, Pagination } from '@shared/components';
import { ArrowLeft } from 'lucide-react';
import { useGenericSearchFilter } from '@shared/hooks/ui/useGenericSearchFilter';
import { useResponsiveClasses, useDeviceUtils } from '@shared/hooks/ui/useResponsiveClasses';
import { useResponsivePageSize } from '@shared/hooks/ui/useResponsivePageSize';
import type { ChatMessage } from '@features/chat/types/chat';
import { getUserSessionsV2 } from '@features/chat/api/jsonbChatFlowApi';
import { getSessionTitle } from '@features/chat/config/sessionTitleConfig';
import type { FilterConfig } from '@shared/types/filters';

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  status: 'active' | 'ended';
}

const ChatHistory: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Responsive hooks
  const { spacingClasses } = useResponsiveClasses();
  const { isMobile } = useDeviceUtils();

  // Responsive page size
  const pageSize = useResponsivePageSize({
    itemHeight: 120, // Approximate height of a chat card
    itemSpacing: 24, // space-y-6 = 24px
    headerOffset: 200, // Navbar + header + search/filter
    footerOffset: 80, // Pagination height
    minItems: 2,
    maxItems: 20,
    useDynamicCalculation: true,
  });

  // Filter configuration for chat conversations
  const filterConfig: FilterConfig = {
    showDateRange: false,
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
    items: conversations,
    searchFields: ['title', 'id'],
    dateField: 'createdAt',
    filterConfig,
    statusField: 'status',
  });

  // Pagination logic
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedConversations = allFilteredConversations.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const openConversation = (id: string) => {
    // Store session ID in localStorage and navigate
    console.log('ChatHistory: Opening conversation:', id);
    localStorage.setItem('pendingSessionId', id);
    navigate('/customer');
  };

  // Load conversations from DB (using chat_sessions_v2)
  useEffect(() => {
    (async () => {
      try {
        const list = await getUserSessionsV2();
        const convs: Conversation[] = list.map(s => ({
          id: s.sessionId,
          title: getSessionTitle({
            flowId: s.flowId,
            metadata: {
              title: s.displayTitle,
            },
          }),
          createdAt: s.createdAt,
          updatedAt: s.createdAt, // getUserSessionsV2 doesn't return updatedAt, use createdAt
          messages: [],
          status: (s.status === 'ended' ? 'ended' : 'active') as
            | 'active'
            | 'ended',
        }));
        setConversations(convs);
      } catch (e) {
        console.error('ChatHistory load sessions error', e);
      }
    })();
  }, []);

  return (
    <ResponsivePageLayout>
      <div className="space-y-4">
        {/* Back to Dashboard */}
        <div className="flex justify-start">
          <Button
            threeD
            variant="ghost"
            size="sm"
            onClick={() => window.location.assign('/customer')}
            className="text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Page Title */}
        <div>
          <Text
            variant="h1"
            size="xl"
            weight="bold"
            className="device-text-heading text-neutral-900 mt-5 mb-5"
          >
            Chat History
          </Text>
        </div>

        {/* Search and Filter Section */}
        <div className="relative mb-6 sm:mb-8">
          {/* Filter and Search Row - Always horizontal layout with responsive spacing */}
          <div className={`flex items-center ${spacingClasses.gap}`}>
            {/* Filter Component - Floating mode */}
            <div className={`${isMobile ? 'w-24' : 'w-auto'} shrink-0`}>
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
              {allFilteredConversations.length === 1 ? 'conversation' : 'conversations'}
            </div>
          )}
        </div>

        {/* Pagination */}
        {allFilteredConversations.length > pageSize && (
          <div className="mt-6">
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={allFilteredConversations.length}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        <div className="space-y-4">
          {paginatedConversations.map(conversation => (
            <HistoryItemCard
              key={conversation.id}
              type="chat"
              displayId={conversation.title}
              title={''}
              status={conversation.status}
              createdAt={conversation.createdAt}
              updatedAt={conversation.updatedAt}
              onClick={() => openConversation(conversation.id)}
            />
          ))}
        </div>

        {allFilteredConversations.length === 0 && (
          <div className="text-center py-12">
            <Text variant="p" className="device-text-body text-neutral-500">
              {conversations.length === 0
                ? 'No conversations found.'
                : 'No conversations match your filters.'}
            </Text>
          </div>
        )}
      </div>
    </ResponsivePageLayout>
  );
};

export default ChatHistory;
