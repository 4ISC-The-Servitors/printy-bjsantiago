// Admin orders context using real Supabase data from orders_duplicate table
import React, { createContext, useContext } from 'react';
import { useAdminOrders } from './useAdminOrders';

// Import the AdminOrderRow type from useAdminOrders
import type { AdminOrderRow } from './useAdminOrders';

interface OrdersContextValue {
  orders: AdminOrderRow[];
  updateOrder: (orderId: string, updates: Partial<AdminOrderRow>) => void;
  refreshOrders: () => void;
  loading: boolean;
  error: string | null;
}

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

export const OrdersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use the useAdminOrders hook to fetch real data
  const { orders, loading, error, refresh } = useAdminOrders(100); // Load more orders for the context

  const updateOrder = (_orderId: string, _updates: Partial<AdminOrderRow>) => {
    // Optimistic update - update local state immediately
    // Note: This assumes the orders state is accessible from the hook
    // The actual optimistic update will be handled by the useAdminOrders hook

    // Then refresh from database to ensure consistency
    refresh();
  };

  const refreshOrders = () => {
    refresh();
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        updateOrder,
        refreshOrders,
        loading,
        error,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};
