import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/supabase';
import ResponsivePageLayout from '@customer/components/shared/layouts/ResponsivePageLayout';
import HistoryItemCard from '@customer/components/shared/cards/HistoryItemCard';
import {
  Card,
  Button,
  Text,
  Search,
  Filter,
  Pagination,
} from '@shared/components';
import { ArrowLeft } from 'lucide-react';
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

  // Load orders from database
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

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

        setOrders(orderList);
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    };

    loadOrders();
  }, []);

  const handleItemClick = (order: Order) => {
    // TODO: Navigate to order details page
    console.log('Order clicked:', order.displayId);
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
    </ResponsivePageLayout>
  );
};

export default OrderHistory;
