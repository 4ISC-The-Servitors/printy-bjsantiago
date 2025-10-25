import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@lib/supabase';
import ResponsivePageLayout from '@customer/components/shared/layouts/ResponsivePageLayout';
import HistoryItemCard from '@customer/components/shared/cards/HistoryItemCard';
import {
  Card,
  Text,
  Search,
  Filter,
  Pagination,
  ToastContainer,
  Breadcrumbs,
} from '@shared/components';
import TrackQuoteButton from '@customer/components/dashboard/recentQuotes/TrackQuoteButton';
import { useGenericSearchFilter } from '@shared/hooks/ui/useGenericSearchFilter';
import { FILTER_CONFIGS } from '@shared/types/filters';
import {
  useResponsiveClasses,
  useDeviceUtils,
} from '@shared/hooks/ui/useResponsiveClasses';
import { useResponsivePageSize } from '@shared/hooks/ui/useResponsivePageSize';
import { CustomerHistoryLoading } from '@customer/components/loadingStates';

// Chat components and hooks
import {
  CustomerChatPanel,
  CustomerChatOverlay,
} from '@features/chat/components/layouts';
import SidebarPanel from '@customer/components/shared/sidebar/SidebarPanel';
import LogoutButton from '@customer/components/shared/sidebar/LogoutButton';
import LogoutModal from '@customer/components/shared/sidebar/LogoutModal';
import { useLogoutWithToast } from '@/auth/hooks/useLogoutWithToast';
import { useCustomerConversationsContext } from '@features/chat/hooks/customer/CustomerConversationsProvider';
import { useDashboardChatEvents } from '@features/chat/hooks/customer/useDashboardChatEvents';
import { useRecentChatSessions } from '@features/chat/hooks/customer/useRecentChatSessions';
import { useChatAttachments } from '@features/chat/hooks/shared/useChatAttachments';
import { getSessionTitle } from '@features/chat/config/sessionTitleConfig';
import { formatShortDate } from '@shared/utils/dateFormatter';
import type { ConversationItem } from '@features/chat/hooks/shared/useConversationState';

interface Quote {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  status: string;
  displayId: string;
  subject?: string;
  description?: string;
  quoted_price?: number;
  endedAt?: number;
  acceptedAt?: number;
  rejectedAt?: number;
}

const QuoteHistory: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Chat state management
  const { logout, toasts, toast } = useLogoutWithToast();
  const { isMobileOrTablet } = useDeviceUtils();

  const {
    messages,
    isTyping,
    conversations,
    activeId,
    quickReplies,
    handleSend: sendViaHook,
    handleQuickReply: quickReplyViaHook,
    endChat: endChatViaHook,
    initializeFlow: initializeFlowHook,
    switchConversation: switchConversationHook,
    setActiveId,
    setConversations,
  } = useCustomerConversationsContext();

  // Memoize toast instance to prevent re-creating array on every render
  const toastInstance = useMemo(
    () => [toasts, toast] as [any, any],
    [toasts, toast]
  );

  // Responsive hooks
  const { spacingClasses } = useResponsiveClasses();
  const { isMobile } = useDeviceUtils();

  // Responsive page size
  const pageSize = useResponsivePageSize({
    itemHeight: 140, // Approximate height of a quote card
    itemSpacing: 24, // space-y-6 = 24px
    headerOffset: 200, // Navbar + header + search/filter
    footerOffset: 80, // Pagination height
    minItems: 2,
    maxItems: 20,
    useDynamicCalculation: true,
  });

  // Search + Filter logic using generic search filter
  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: allFilteredQuotes,
  } = useGenericSearchFilter({
    items: quotes,
    searchFields: [
      'id',
      'displayId',
      'title',
      'status',
      'subject',
      'createdAt',
      'updatedAt',
    ],
    dateField: 'createdAt',
    filterConfig: FILTER_CONFIGS.quotes,
    statusField: 'status',
  });

  // Pagination logic
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedQuotes = allFilteredQuotes.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // Chat functionality
  useRecentChatSessions(setConversations);

  // Initialize flow via useCustomerConversations
  const initializeFlow = (flowId: string, title: string, ctx: unknown = {}) => {
    initializeFlowHook(flowId, title, ctx);
  };

  // Dashboard chat events for quote flows
  useDashboardChatEvents(
    initializeFlow,
    switchConversationHook,
    () => undefined, // No recent order context for quote history
    () => undefined // No recent total context for quote history
  );

  // Attachments
  const { handleAttachFiles } = useChatAttachments(sendViaHook);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout('/auth/signin');
  };

  // Load recent chat sessions from database for the sidebar list (initial)
  useEffect(() => {
    const loadRecentSessions = async () => {
      try {
        const { data: sessions, error } = await supabase
          .from('chat_sessions_v2')
          .select(
            `
            session_id,
            customer_id,
            status,
            created_at,
            flow_id,
            display_title,
            metadata,
            inquiry:inquiries_v2!inquiry_id(
              inquiry_id,
              display_id,
              inquiry_type,
              inquiry_status
            ),
            quote:quotes!quote_id(
              quote_id,
              display_id,
              status
            ),
            order:orders!order_id(
              order_id,
              display_id,
              status
            )
          `
          )
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching sessions:', error);
          return;
        }

        if (sessions && sessions.length > 0) {
          const sessionConversations: ConversationItem[] = sessions.map(
            (session: any) => ({
              id: session.session_id,
              title: getSessionTitle({
                flowId: session.flow_id,
                metadata: {
                  context: {
                    display_id: session.metadata?.context?.display_id || session.inquiry?.display_id || session.quote?.display_id || session.order?.display_id,
                  },
                },
                inquiry: session.inquiry,
                quote: session.quote,
                order: session.order,
              }),
              createdAt: new Date(session.created_at).getTime(),
              messages: [], // Messages will be loaded when switching to conversation
              flowId: session.flow_id || 'about',
              status: session.status === 'ended' ? 'ended' : 'active',
              icon: undefined,
            })
          );

          setConversations(prev => {
            // Merge with existing conversations, avoiding duplicates
            const existingIds = new Set(prev.map(c => c.id));
            const newConversations = sessionConversations.filter(
              c => !existingIds.has(c.id)
            );
            return [...newConversations, ...prev].sort(
              (a, b) => b.createdAt - a.createdAt
            );
          });
        }
      } catch (e) {
        console.error('loadRecentSessions error', e);
      }
    };

    loadRecentSessions();
  }, []);

  // Load quotes from database
  useEffect(() => {
    const loadQuotes = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Optimized single query with JOINs to fetch all data at once
        const { data, error } = await supabase
          .from('quotes')
          .select(`
            quote_id,
            session_id,
            display_id,
            status,
            created_at,
            updated_at,
            ended_at,
            proposal_id,
            quote_proposals!inner(
              quoted_price,
              spec_id,
              created_at
            )
          `)
          .eq('customer_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error loading quotes:', error);
          return;
        }

        // Process the joined data - no more N+1 queries!
        const quoteList: Quote[] = (data || []).map(quote => {
          const proposalsRaw = quote.quote_proposals as any;

          // Handle Supabase JOIN data structure - can be array or single object
          const proposals = Array.isArray(proposalsRaw) ? proposalsRaw : [proposalsRaw].filter(Boolean);

          // Get quoted price from first proposal if exists
          const quotedPrice = proposals && proposals.length > 0 ? proposals[0]?.quoted_price : undefined;

          // For subject and description, we'll use fallbacks since spec data requires additional queries
          // This maintains performance while providing basic information
          const subject = 'Quote Request';
          const description = undefined;

          // Set acceptedAt or rejectedAt based on status
          const updatedAt = new Date(quote.updated_at).getTime();
          const acceptedAt = quote.status === 'accepted' ? updatedAt : undefined;
          const rejectedAt = quote.status === 'rejected' ? updatedAt : undefined;

          return {
            id: quote.quote_id,
            title: subject,
            createdAt: new Date(quote.created_at).getTime(),
            updatedAt: updatedAt,
            status: quote.status,
            displayId: quote.display_id || quote.quote_id,
            subject: subject,
            description: description,
            quoted_price: quotedPrice,
            endedAt: quote.ended_at
              ? new Date(quote.ended_at).getTime()
              : undefined,
            acceptedAt: acceptedAt,
            rejectedAt: rejectedAt,
          };
        });

        // Sort by updatedAt descending (most recent first)
        quoteList.sort((a, b) => b.updatedAt - a.updatedAt);

        setQuotes(quoteList);
      } catch (error) {
        console.error('Error loading quotes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuotes();
  }, []);

  const handleItemClick = (_quote: Quote) => {
    // TODO: Navigate to quote details or open chat
  };

  // Build actions for each quote
  const renderQuoteActions = (quote: Quote) => {
    const statusLower = quote.status.toLowerCase();

    // Only show track button for quotes that are not accepted or rejected
    if (statusLower !== 'accepted' && statusLower !== 'rejected') {
      return (
        <TrackQuoteButton
          conversationId={quote.id}
          subject={quote.subject || quote.title}
          status={quote.status}
          displayId={quote.displayId}
        />
      );
    }

    return null;
  };

  // Build metadata for each quote
  const buildQuoteMetadata = (quote: Quote) => {
    const metadata: Record<string, string> = {};

    if (quote.description) {
      metadata.description = quote.description;
    }

    if (quote.quoted_price) {
      // Pass as 'total' so HistoryItemCard displays it in the pricing row
      metadata.total = `₱${Number(quote.quoted_price).toLocaleString()}`;
    }

    if (quote.endedAt) {
      metadata.ended = formatShortDate(quote.endedAt);
    }

    if (quote.acceptedAt) {
      metadata.accepted = formatShortDate(quote.acceptedAt);
    }

    if (quote.rejectedAt) {
      metadata.rejected = formatShortDate(quote.rejectedAt);
    }

    return metadata;
  };

  // Quote history content
  const quoteHistoryContent = isLoading ? (
    <CustomerHistoryLoading title="Quote History" />
  ) : (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', path: '/customer' },
            { label: 'Order History', path: '/customer/orders' },
            { label: 'Quote History', isActive: true },
            { label: 'Ticket History', path: '/customer/tickets' },
            { label: 'Chat History', path: '/customer/chats' },
          ]}
        />
      </div>

      {/* Page Title */}
      <div>
        <Text
          variant="h1"
          size="xl"
          weight="bold"
          className="device-text-heading text-neutral-900 mt-5 mb-5"
        >
          Quote History
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
              filterConfig={FILTER_CONFIGS.quotes}
              showResultCount={false}
              resultCount={allFilteredQuotes.length}
              floating={true}
            />
          </div>

          {/* Search Bar - Takes remaining space */}
          <div className="flex-1 min-w-0">
            <Search
              value={search}
              onChange={v => setSearch(v)}
              placeholder="Search by quote ID, subject, or status..."
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
              {allFilteredQuotes.length}
            </span>{' '}
            {allFilteredQuotes.length === 1 ? 'quote' : 'quotes'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {allFilteredQuotes.length > pageSize && (
        <div className="mt-6">
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={allFilteredQuotes.length}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <div className="space-y-4">
        {paginatedQuotes.map(quote => (
          <HistoryItemCard
            key={quote.id}
            type="quote"
            displayId={quote.displayId}
            title={quote.subject || quote.title}
            status={quote.status}
            createdAt={quote.createdAt}
            updatedAt={quote.updatedAt}
            metadata={buildQuoteMetadata(quote)}
            actions={renderQuoteActions(quote)}
            onClick={() => handleItemClick(quote)}
          />
        ))}
      </div>

      {allFilteredQuotes.length === 0 && (
        <Card className="p-8 text-center">
          <Text variant="p" className="text-neutral-500">
            {quotes.length === 0
              ? 'No quotes found.'
              : 'No quotes match your filters.'}
          </Text>
        </Card>
      )}
    </div>
  );

  // When chat is active, render without ResponsivePageLayout to avoid extra containers
  if (activeId) {
    return (
      <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
        {/* Desktop Sidebar (>= lg) */}
        <aside className="hidden lg:flex w-64 xl:w-80 bg-white border-r border-neutral-200 flex-col">
          <SidebarPanel
            conversations={conversations}
            activeId={activeId}
            onSwitchConversation={id => {
              setActiveId(id);
              window.dispatchEvent(
                new CustomEvent('customer-open-session', {
                  detail: { sessionId: id },
                })
              );
            }}
            onNavigateToAccount={() => {
              window.location.href = '/customer/account';
            }}
            bottomActions={<LogoutButton onClick={handleLogout} />}
          />
        </aside>

        {/* Main Content Area - Chat Panel/Overlay */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {isMobileOrTablet ? (
            <CustomerChatOverlay
              open={!!activeId}
              onClose={() => setActiveId(null)}
              title={
                conversations.find(c => c.id === activeId)?.title || 'Chat'
              }
              messages={messages}
              isTyping={isTyping}
              quickReplies={quickReplies}
              onSend={sendViaHook}
              onQuickReply={quickReplyViaHook}
              onEndChat={endChatViaHook}
              readOnly={
                conversations.find(c => c.id === activeId)?.status === 'ended'
              }
              sessionId={activeId}
              conversationId={activeId}
              toast={toastInstance}
            />
          ) : (
            <CustomerChatPanel
              title={
                conversations.find(c => c.id === activeId)?.title || 'Chat'
              }
              messages={messages}
              onSend={sendViaHook}
              isTyping={isTyping}
              onBack={() => {
                setActiveId(null);
                window.dispatchEvent(new CustomEvent('customer-chat-closed'));
              }}
              onMinimize={() => {
                setActiveId(null);
                window.dispatchEvent(new CustomEvent('customer-chat-closed'));
              }}
              quickReplies={quickReplies}
              onQuickReply={quickReplyViaHook}
              onEndChat={endChatViaHook}
              onAttachFiles={handleAttachFiles}
              readOnly={
                conversations.find(c => c.id === activeId)?.status === 'ended'
              }
              hideInput={
                conversations.find(c => c.id === activeId)?.status === 'ended'
              }
              toast={toastInstance}
              sessionId={activeId}
              conversationId={activeId}
            />
          )}
        </main>

        <ToastContainer
          toasts={toasts}
          onRemoveToast={id => toast.remove(id)}
          position={isMobileOrTablet ? 'top-center' : 'bottom-right'}
        />

        {/* Logout Modal */}
        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={confirmLogout}
        />
      </div>
    );
  }

  // Normal quote history view with ResponsivePageLayout
  return (
    <>
      <ResponsivePageLayout showSidebar={true}>
        {quoteHistoryContent}
      </ResponsivePageLayout>

      <ToastContainer
        toasts={toasts}
        onRemoveToast={id => toast.remove(id)}
        position={isMobileOrTablet ? 'top-center' : 'bottom-right'}
      />

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
};

export default QuoteHistory;
