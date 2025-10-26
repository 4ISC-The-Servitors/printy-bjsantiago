import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import PayNowButton from '@customer/components/dashboard/recentOrders/PayNowButton';
import ReuploadPaymentButton from '@customer/components/dashboard/recentOrders/ReuploadPaymentButton';
import { formatShortDate } from '@shared/utils/dateFormatter';
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
import { usePaymentProofUpload } from '@/features/chat/hooks/customer/usePaymentProofUpload';

interface Order {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  status: string;
  displayId: string;
  total?: string;
  order_specs?: any;
  paymentVerifiedAt?: number;
  completedAt?: number;
}

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
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
    itemHeight: 140, // Approximate height of an order card
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
    filteredItems: allFilteredOrders,
  } = useGenericSearchFilter({
    items: orders,
    searchFields: [
      'id',
      'displayId',
      'title',
      'status',
      'total',
      'createdAt',
      'updatedAt',
    ],
    dateField: 'createdAt',
    filterConfig: FILTER_CONFIGS.orders,
    statusField: 'status',
  });

  // Pagination logic
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = allFilteredOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // Initialize flow via useCustomerConversations
  const initializeFlow = (flowId: string, title: string, ctx: unknown = {}) => {
    initializeFlowHook(flowId, title, ctx);
  };

  // Dashboard chat events for payment flows
  useDashboardChatEvents(
    initializeFlow,
    switchConversationHook,
    () => undefined, // No recent order context for order history
    () => undefined // No recent total context for order history
  );

  // Attachments
  const { handleAttachFiles } = useChatAttachments(sendViaHook);
  const { handlePaymentProofUpload } = usePaymentProofUpload();

  // Check if current conversation is a payment flow
  const activeConversation = conversations.find(c => c.id === activeId);
  const isPaymentFlow =
    activeId &&
    activeConversation &&
    (activeConversation.title?.toLowerCase().includes('payment') ||
      activeConversation.title?.toLowerCase().includes('pay'));

  // Enhanced file upload handler that uses payment proof upload for payment flows
  const handleFileUpload = useCallback(
    async (files: FileList) => {

      if (isPaymentFlow && activeConversation) {
        // Get order ID from payment flow context
        let orderId = activeConversation.context?.order_id;


        if (orderId && typeof orderId === 'string') {
          // Use payment proof upload for payment flows
          await handlePaymentProofUpload(
            files,
            orderId,
            url => {
              // Send the uploaded file URL to the chat
              sendViaHook(String(url));
            },
            error => {
              // Handle error - could show a toast or error message
              console.error('Payment proof upload failed:', error);
              sendViaHook(`Upload failed: ${error}`);
            }
          );
        } else {
          console.error('No valid order ID available for payment proof upload');
          sendViaHook('Error: No valid order ID available. Please try again.');
        }
      } else {
        // Use regular chat attachments for other flows
        handleAttachFiles(files);
      }
    },
    [
      isPaymentFlow,
      activeConversation,
      handlePaymentProofUpload,
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

  // Load orders from database
  useEffect(() => {
    const loadOrders = async () => {
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
          .from('orders')
          .select(
            `
            order_id,
            display_id,
            status,
            created_at,
            updated_at,
            total_amount,
            order_specs,
            payment_verified_at,
            completed_at
          `
          )
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading orders:', error);
          setIsLoading(false);
          return;
        }

        const orderList: Order[] = (data || []).map(order => ({
          id: order.order_id,
          title: order.order_specs?.product_name || 'Order',
          createdAt: new Date(order.created_at).getTime(),
          updatedAt: new Date(order.updated_at).getTime(),
          status: order.status,
          displayId: order.display_id || order.order_id,
          total: order.total_amount
            ? `₱${Number(order.total_amount).toLocaleString()}`
            : undefined,
          order_specs: order.order_specs,
          paymentVerifiedAt: order.payment_verified_at
            ? new Date(order.payment_verified_at).getTime()
            : undefined,
          completedAt: order.completed_at
            ? new Date(order.completed_at).getTime()
            : undefined,
        }));

        // Sort by updatedAt descending (most recent first)
        orderList.sort((a, b) => b.updatedAt - a.updatedAt);

        setOrders(orderList);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const handleItemClick = (_order: Order) => {
    // TODO: Navigate to order details page
  };

  // Build actions for each order
  const renderOrderActions = (order: Order) => {
    const statusLower = order.status.toLowerCase();

    if (statusLower === 'awaiting_payment') {
      return (
        <PayNowButton
          orderId={order.id}
          displayId={order.displayId}
          total={order.total}
        />
      );
    }

    if (statusLower === 'reupload_payment') {
      return (
        <ReuploadPaymentButton
          orderId={order.id}
          displayId={order.displayId}
          total={order.total}
        />
      );
    }

    // For completed orders, we don't show any action button
    // as per the existing button components logic
    return null;
  };

  const buildOrderMetadata = (order: Order) => {
    const metadata: Record<string, string> = {};

    if (order.total) {
      metadata.total = order.total;
    }

    if (order.paymentVerifiedAt) {
      metadata['payment verified'] = formatShortDate(order.paymentVerifiedAt);
    }

    if (order.completedAt) {
      metadata.completed = formatShortDate(order.completedAt);
    }

    return metadata;
  };

  // Order history content
  const orderHistoryContent = isLoading ? (
    <CustomerHistoryLoading title="Order History" />
  ) : (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', path: '/customer' },
            { label: 'Order History', isActive: true },
            { label: 'Quote History', path: '/customer/quotes' },
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
          Order History
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
              filterConfig={FILTER_CONFIGS.orders}
              showResultCount={false}
              resultCount={allFilteredOrders.length}
              floating={true}
            />
          </div>

          {/* Search Bar - Takes remaining space */}
          <div className="flex-1 min-w-0">
            <Search
              value={search}
              onChange={v => setSearch(v)}
              placeholder="Search by order ID, product, or amount..."
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
              {allFilteredOrders.length}
            </span>{' '}
            {allFilteredOrders.length === 1 ? 'order' : 'orders'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {allFilteredOrders.length > pageSize && (
        <div className="mt-6">
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={allFilteredOrders.length}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <div className="space-y-4">
        {paginatedOrders.map(order => (
          <HistoryItemCard
            key={order.id}
            type="order"
            displayId={order.displayId}
            title={order.title}
            status={order.status}
            createdAt={order.createdAt}
            updatedAt={order.updatedAt}
            metadata={buildOrderMetadata(order)}
            actions={renderOrderActions(order)}
            onClick={() => handleItemClick(order)}
          />
        ))}
      </div>

      {allFilteredOrders.length === 0 && (
        <Card className="p-8 text-center">
          <Text variant="p" className="text-neutral-500">
            {orders.length === 0
              ? 'No orders found.'
              : 'No orders match your filters.'}
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

  // Normal order history view with ResponsivePageLayout
  return (
    <>
      <ResponsivePageLayout showSidebar={true}>
        {orderHistoryContent}
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

export default OrderHistory;
