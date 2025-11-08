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
import TrackTicketButton from '@customer/components/dashboard/recentTickets/TrackTicketButton';
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
import { useChatAttachments } from '@features/chat/hooks/shared/useChatAttachments';
import { useTicketImageUpload } from '@features/chat/hooks/customer/useTicketImageUpload';
import { formatInquiryType } from '@shared/utils/statusFormatter';

interface Ticket {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  status: string;
  displayId: string;
  subject?: string;
  description?: string;
  resolvedAt?: number;
  assignedTo?: string;
}

const TicketHistory: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
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
    itemHeight: 140, // Approximate height of a ticket card
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
    filteredItems: allFilteredTickets,
  } = useGenericSearchFilter({
    items: tickets,
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
    filterConfig: FILTER_CONFIGS.tickets,
    statusField: 'status',
  });

  // Pagination logic
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTickets = allFilteredTickets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // Initialize flow via useCustomerConversations
  const initializeFlow = (flowId: string, title: string, ctx: unknown = {}) => {
    initializeFlowHook(flowId, title, ctx);
  };

  // Dashboard chat events for ticket flows
  useDashboardChatEvents(
    initializeFlow,
    switchConversationHook,
    () => undefined, // No recent order context for ticket history
    () => undefined // No recent total context for ticket history
  );

  // Attachments
  const { handleAttachFiles } = useChatAttachments(sendViaHook);
  const { handleTicketImageUpload } = useTicketImageUpload();

  // Enhanced file upload handler that uses ticket image upload for ticket flows
  const handleFileUpload = React.useCallback(
    async (files: FileList) => {
      // Re-check flow detection inside callback to ensure we have latest values
      const currentConversation = conversations.find(c => c.id === activeId);
      const isTicketFlowNow =
        activeId &&
        currentConversation &&
        (currentConversation.title?.toLowerCase().includes('track ticket') ||
          currentConversation.flowId === 'track-ticket');

      console.log('[handleFileUpload] Called', {
        isTicketFlowNow,
        activeId,
        flowId: currentConversation?.flowId,
        title: currentConversation?.title,
        hasActiveConversation: !!currentConversation,
      });

      if (isTicketFlowNow && activeId) {
        // Try to get inquiry ID from multiple sources:
        // 1. From conversation context (both camelCase and snake_case)
        let inquiryId =
          currentConversation?.context?.inquiryId ||
          currentConversation?.context?.inquiry_id;

        // 2. If not in context, fetch from session's FK column
        if (!inquiryId) {
          try {
            const { data: sessionData } = await supabase
              .from('chat_sessions_v2')
              .select('inquiry_id, metadata')
              .eq('session_id', activeId)
              .single();

            inquiryId =
              sessionData?.inquiry_id ||
              sessionData?.metadata?.context?.inquiryId ||
              sessionData?.metadata?.context?.inquiry_id;
          } catch (error) {
            console.error('Error fetching inquiry ID from session:', error);
          }
        }

        if (inquiryId && typeof inquiryId === 'string') {
          console.log('[handleFileUpload] Uploading to ticket-uploads bucket', {
            inquiryId,
          });
          // Use ticket image upload for ticket flows - wait for upload to complete
          await handleTicketImageUpload(
            files,
            inquiryId,
            url => {
              console.log(
                '[handleFileUpload] Upload successful, sending URL:',
                url
              );
              // Send the uploaded storage URL (not blob URL) to the chat
              // This ensures the image persists in the database
              sendViaHook(String(url));
            },
            error => {
              // Handle error - show error message
              console.error('Ticket image upload failed:', error);
              sendViaHook(`Upload failed: ${error}`);
            }
          );
        } else {
          console.error(
            'No valid inquiry ID available for ticket image upload',
            {
              context: currentConversation?.context,
              activeId,
            }
          );
          sendViaHook(
            'Error: No valid inquiry ID available. Please try again.'
          );
        }
      } else {
        console.log(
          '[handleFileUpload] Not a ticket flow, using regular attachments'
        );
        // Use regular chat attachments for other flows (these create blob URLs)
        handleAttachFiles(files);
      }
    },
    [
      conversations,
      activeId,
      handleTicketImageUpload,
      sendViaHook,
      handleAttachFiles,
    ]
  );

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout('/auth/signin');
  };

  // Load tickets from database (inquiries_v2)
  useEffect(() => {
    const loadTickets = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('inquiries_v2')
          .select(
            `
            inquiry_id,
            display_id,
            inquiry_status,
            received_at,
            updated_at,
            inquiry_type,
            customer_id,
            order_id,
            session_id
          `
          )
          .eq('customer_id', user.id)
          .order('received_at', { ascending: false });

        if (error) {
          console.error('Error loading tickets:', error);
          setIsLoading(false);
          return;
        }

        const ticketList: Ticket[] = (data || []).map(ticket => ({
          id: ticket.inquiry_id,
          title: formatInquiryType(ticket.inquiry_type || 'other'),
          createdAt: new Date(ticket.received_at).getTime(),
          updatedAt: ticket.updated_at
            ? new Date(ticket.updated_at).getTime()
            : new Date(ticket.received_at).getTime(),
          status: ticket.inquiry_status,
          displayId:
            ticket.display_id ||
            ticket.inquiry_id.substring(0, 8).toUpperCase(),
          subject: formatInquiryType(ticket.inquiry_type || 'other'),
          description: undefined,
          resolvedAt: undefined,
          assignedTo: undefined,
        }));

        // Sort by updatedAt descending (most recent first)
        ticketList.sort((a, b) => b.updatedAt - a.updatedAt);

        setTickets(ticketList);
      } catch (error) {
        console.error('Error loading tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, []);

  const handleItemClick = (_ticket: Ticket) => {
    // TODO: Navigate to ticket details page or open chat
  };

  // Build actions for each ticket
  const renderTicketActions = (ticket: Ticket) => {
    const statusLower = ticket.status.toLowerCase();

    // Only show track button for tickets that are not resolved or closed
    if (statusLower !== 'resolved' && statusLower !== 'closed') {
      return (
        <TrackTicketButton
          inquiryId={ticket.id}
          subject={ticket.subject || ticket.title}
          status={ticket.status}
          displayId={ticket.displayId}
        />
      );
    }

    return null;
  };

  // Build metadata for each ticket
  const buildTicketMetadata = (ticket: Ticket) => {
    const metadata: Record<string, string> = {};

    if (ticket.subject && ticket.subject !== ticket.title) {
      metadata.subject = ticket.subject;
    }

    if (ticket.description) {
      metadata.description = ticket.description;
    }

    if (ticket.assignedTo) {
      metadata.assigned = ticket.assignedTo;
    }

    if (ticket.resolvedAt) {
      metadata.resolved = new Date(ticket.resolvedAt).toLocaleDateString();
    }

    return metadata;
  };

  // Ticket history content
  const ticketHistoryContent = isLoading ? (
    <CustomerHistoryLoading title="Ticket History" />
  ) : (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', path: '/customer' },
            { label: 'Order History', path: '/customer/orders' },
            { label: 'Quote History', path: '/customer/quotes' },
            { label: 'Ticket History', isActive: true },
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
          Ticket History
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
              filterConfig={FILTER_CONFIGS.tickets}
              showResultCount={false}
              resultCount={allFilteredTickets.length}
              floating={true}
            />
          </div>

          {/* Search Bar - Takes remaining space */}
          <div className="flex-1 min-w-0">
            <Search
              value={search}
              onChange={v => setSearch(v)}
              placeholder="Search by ticket ID, subject, or status..."
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
              {allFilteredTickets.length}
            </span>{' '}
            {allFilteredTickets.length === 1 ? 'ticket' : 'tickets'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {allFilteredTickets.length > pageSize && (
        <div className="mt-6">
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={allFilteredTickets.length}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <div className="space-y-4">
        {paginatedTickets.map(ticket => (
          <HistoryItemCard
            key={ticket.id}
            type="ticket"
            displayId={ticket.displayId}
            title={ticket.subject || ticket.title}
            status={ticket.status}
            createdAt={ticket.createdAt}
            updatedAt={ticket.updatedAt}
            metadata={buildTicketMetadata(ticket)}
            actions={renderTicketActions(ticket)}
            onClick={() => handleItemClick(ticket)}
          />
        ))}
      </div>

      {allFilteredTickets.length === 0 && (
        <Card className="p-8 text-center">
          <Text variant="p" className="text-neutral-500">
            {tickets.length === 0
              ? 'No tickets found.'
              : 'No tickets match your filters.'}
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
              onAttachFiles={handleFileUpload}
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
              onAttachFiles={handleFileUpload}
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

  // Normal ticket history view with ResponsivePageLayout
  return (
    <>
      <ResponsivePageLayout showSidebar={true}>
        {ticketHistoryContent}
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

export default TicketHistory;
