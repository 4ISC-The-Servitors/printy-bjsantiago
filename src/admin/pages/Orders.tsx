// BACKEND_TODO: Ensure OrdersProvider is wired to Supabase (queries + realtime).
// This page should not depend on mock data once backend is live.
import React from 'react';
import { OrdersCard } from '@admin/components';
import { Search, Filter, Card, Text } from '@shared/components';
import { OrdersProvider, useOrders } from '@admin/hooks/OrdersContext';
import { useGenericSearchFilter } from '@shared/hooks/ui/useGenericSearchFilter';
import {
  useResponsiveClasses,
  useDeviceUtils,
} from '@shared/hooks/ui/useResponsiveClasses';
import { FILTER_CONFIGS } from '@shared/types/filters';

const OrdersContent: React.FC = () => {
  const { orders: ordersAll } = useOrders();

  // Responsive hooks
  const { spacingClasses } = useResponsiveClasses();
  const { isMobile } = useDeviceUtils();

  // Search + Filter logic using generic search filter
  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: filteredOrders,
  } = useGenericSearchFilter({
    items: ordersAll,
    searchFields: [
      'id',
      'display_id',
      'product_name',
      'customer_name',
      'status',
      'customer_type',
      'total_amount',
      'created_at',
      'updated_at',
      'completed_at',
    ],
    dateField: 'created_at',
    filterConfig: FILTER_CONFIGS.orders,
    statusField: 'status',
    roleField: 'customer_type',
  });

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
              filterConfig={FILTER_CONFIGS.orders}
              showResultCount={false}
              resultCount={filteredOrders.length}
              floating={true}
            />
          </div>

          {/* Search Bar - Takes remaining space */}
          <div className="flex-1 min-w-0">
            <Search
              value={search}
              onChange={v => setSearch(v)}
              placeholder="Search by order ID, customer, product, or amount..."
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
              {filteredOrders.length}
            </span>{' '}
            {filteredOrders.length === 1 ? 'order' : 'orders'}
          </div>
        )}
      </div>

      {/* Orders List / Empty State */}
      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center">
          <Text variant="p" className="text-neutral-500">
            {ordersAll.length === 0
              ? 'No orders found.'
              : 'No orders match your filters.'}
          </Text>
        </Card>
      ) : (
        <OrdersCard filteredOrders={filteredOrders} />
      )}
    </div>
  );
};

const AdminOrders: React.FC = () => {
  return (
    <OrdersProvider>
      <OrdersContent />
    </OrdersProvider>
  );
};

export default AdminOrders;
