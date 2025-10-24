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

// Chat components and hooks
import {
  CustomerChatPanel,
  CustomerChatOverlay,
} from '@features/chat/components/layouts';
import SidebarPanel from '@customer/components/shared/sidebar/SidebarPanel';
import LogoutButton from '@customer/components/shared/sidebar/LogoutButton';
import LogoutModal from '@customer/components/shared/sidebar/LogoutModal';
import { useLogoutWithToast } from '@/auth/hooks/useLogoutWithToast';
import { useCustomerConversations } from '@features/chat/hooks/customer/useCustomerConversations';
import { useDashboardChatEvents } from '@features/chat/hooks/customer/useDashboardChatEvents';
import { useRecentChatSessions } from '@features/chat/hooks/customer/useRecentChatSessions';
import { useChatAttachments } from '@features/chat/hooks/shared/useChatAttachments';
import { getSessionTitle } from '@features/chat/config/sessionTitleConfig';
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
}

const QuoteHistory: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
  } = useCustomerConversations();

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
            metadata->context->display_id
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
                  title: session.display_title,
                  context: {
                    display_id: session.display_id,
                  },
                },
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
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('quotes')
          .select(
            `
            quote_id,
            session_id,
            display_id,
            status,
            created_at,
            updated_at,
            ended_at,
            proposal_id
          `
          )
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading quotes:', error);
          return;
        }

        // Get quoted prices and spec details from related tables
        const quoteList: Quote[] = await Promise.all(
          (data || []).map(async quote => {
            let quotedPrice: number | undefined;
            let subject = 'Quote Request';
            let description = undefined;

            // Get spec data for subject and description (using session_id)
            const { data: specs, error: specError } = await supabase
              .from('quote_specs')
              .select('spec_data')
              .eq('session_id', quote.session_id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (specError) {
              console.warn(
                'Error fetching spec for quote:',
                quote.quote_id,
                specError
              );
            }

            if (specs && specs.length > 0 && specs[0]?.spec_data) {
              subject = specs[0].spec_data.product_name || 'Quote Request';
              description = specs[0].spec_data.description;
            }

            // Get quoted price from accepted proposals via quotes table
            if (quote.status === 'accepted' && quote.proposal_id) {
              const { data: proposal, error: proposalError } = await supabase
                .from('quote_proposals')
                .select('quoted_price')
                .eq('proposal_id', quote.proposal_id)
                .maybeSingle();

              if (proposalError) {
                console.warn(
                  'Error fetching proposal for quote:',
                  quote.quote_id,
                  proposalError
                );
              } else {
                quotedPrice = proposal?.quoted_price;
              }
            }

            return {
              id: quote.quote_id,
              title: subject,
              createdAt: new Date(quote.created_at).getTime(),
              updatedAt: new Date(quote.updated_at).getTime(),
              status: quote.status,
              displayId: quote.display_id || quote.quote_id,
              subject: subject,
              description: description,
              quoted_price: quotedPrice,
              endedAt: quote.ended_at
                ? new Date(quote.ended_at).getTime()
                : undefined,
            };
          })
        );

        // Sort by updatedAt descending (most recent first)
        quoteList.sort((a, b) => b.updatedAt - a.updatedAt);

        setQuotes(quoteList);
      } catch (error) {
        console.error('Error loading quotes:', error);
      }
    };

    loadQuotes();
  }, []);

  const handleItemClick = (quote: Quote) => {
    // TODO: Navigate to quote details or open chat
    console.log('Quote clicked:', quote.displayId);
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
      metadata['quoted price'] =
        `₱${Number(quote.quoted_price).toLocaleString()}`;
    }

    if (quote.endedAt) {
      metadata.ended = new Date(quote.endedAt).toLocaleDateString();
    }

    return metadata;
  };

  // Quote history content
  const quoteHistoryContent = (
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
