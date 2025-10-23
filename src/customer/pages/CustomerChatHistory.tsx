import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoutModal from '@customer/components/shared/sidebar/LogoutModal';
import MobileSidebarMenu from '@customer/components/shared/sidebar/MobileSidebarMenu';
import MobileSidebarTrigger from '@customer/components/shared/sidebar/MobileSidebarTrigger';
import Header from '@customer/components/chatHistory/Header';
import ConversationList from '@customer/components/chatHistory/ConversationList';
import { Text, Pagination } from '@shared/components';
import { useResponsivePageSize } from '@shared/hooks/ui/useResponsivePageSize';
import type { ChatMessage } from '@features/chat/types/chat';
import { getUserSessionsV2 } from '@features/chat/api/jsonbChatFlowApi';
import { getSessionTitle } from '@features/chat/config/sessionTitleConfig';
import useGenericSearchFilter from '@shared/hooks/ui/useGenericSearchFilter';
import { Search, Filter } from '@shared/components/forms';
import type { FilterConfig } from '@shared/types/filters';

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  status: 'active' | 'ended';
}

const ChatHistory: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [page, setPage] = useState(1);

  // Responsive page size for conversations
  const pageSize = useResponsivePageSize({
    useDynamicCalculation: true,
    itemHeight: 80, // Approximate height of ConversationItem
    itemSpacing: 8, // space-y-2 = 8px between items
    headerOffset: 240, // Header + search/filter + pagination
    footerOffset: 80, // Bottom padding
    minItems: 3,
    maxItems: 15,
    breakpoints: {
      phone: 3,
      tablet: 5,
      desktop: 8,
    },
  });

  // Auto-close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [navigate]);

  // Responsive layout helper
  const [, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const handleModern = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    const handleLegacy = function (
      this: MediaQueryList,
      e: MediaQueryListEvent
    ) {
      setIsDesktop(e.matches);
    };
    setIsDesktop(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', handleModern);
    else (mql as MediaQueryList).addListener(handleLegacy);
    return () => {
      if (mql.removeEventListener)
        mql.removeEventListener('change', handleModern);
      else (mql as MediaQueryList).removeListener(handleLegacy);
    };
  }, []);

  // Shared search/filter config
  const filterConfig: FilterConfig = {
    statusOptions: [
      { value: 'active', label: 'Active' },
      { value: 'ended', label: 'Ended' },
    ],
    showDateRange: true,
    showStatusFilter: true,
    showRoleFilter: false,
  };

  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems,
  } = useGenericSearchFilter<Conversation>({
    items: conversations,
    searchFields: ['title'],
    dateField: 'createdAt',
    filterConfig,
    statusField: 'status',
  });

  // Paginated conversations from filtered items
  const paginatedConversations = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  // Reset page when filters/search change or when exceeding max pages
  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredItems.length / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [filteredItems.length, pageSize, page]);

  const openConversation = (id: string) => {
    // Store session ID in localStorage and navigate
    console.log('ChatHistory: Opening conversation:', id);
    localStorage.setItem('pendingSessionId', id);
    navigate('/customer');
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    navigate('/auth/signin');
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
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex flex-col">
      {/* Mobile header with burger */}
      <div className="lg:hidden flex flex-col">
        <header className="bg-white/80 backdrop-blur border-b border-neutral-200 px-4 py-3 flex items-center justify-between shrink-0">
          <MobileSidebarTrigger onOpen={() => setShowMobileMenu(true)} />
          <div className="w-10" />
        </header>
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowMobileMenu(false)}>
            <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85%] bg-white" onClick={e => e.stopPropagation()}>
              <MobileSidebarMenu
                onClose={() => setShowMobileMenu(false)}
                onViewAllChats={() => setShowMobileMenu(false)}
                onAccount={() => { setShowMobileMenu(false); navigate('/customer/account'); }}
                onLogout={() => { setShowMobileMenu(false); navigate('/auth/signin'); }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main content - full screen */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1">
          <div className="max-w-6xl mx-auto w-full">
            <Header
              subtitle="View all your past conversations with Printy"
              onBack={() => navigate('/customer')}
            />

            {/* Search + Filter */}
            <div className="grid grid-cols-1 gap-3 mb-4">
              <Search
                value={search}
                onChange={setSearch}
                placeholder="Search conversations..."
                size="md"
              />
              <Filter
                value={filter}
                onChange={setFilter}
                filterConfig={filterConfig}
                showResultCount
                resultCount={filteredItems.length}
              />
            </div>

            {/* Pagination header */}
            <div className="flex items-center justify-center px-1 py-1">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={filteredItems.length}
                onPageChange={setPage}
              />
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Text variant="p" size="base" color="muted">
                  No conversations found.
                </Text>
              </div>
            ) : (
              <ConversationList
                conversations={paginatedConversations}
                onOpen={openConversation}
              />
            )}
          </div>
        </div>
      </main>
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
};

export default ChatHistory;
