// Admin orders context using real Supabase data from orders_duplicate table
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const { orders, loading, error, refresh } = useAdminOrders({
    page: 1,
    pageSize: 100, // Load more orders for the context
  });

  const updateOrder = (orderId: string, updates: Partial<AdminOrderRow>) => {
    console.log('updateOrder called:', orderId, updates);
    // Note: In a real implementation, this would update the database
    // For now, we'll just refresh the data
    refresh();
  };

  const refreshOrders = () => {
    refresh();
  };

  return (
    <OrdersContext.Provider value={{ 
      orders, 
      updateOrder, 
      refreshOrders, 
      loading, 
      error 
    }}>
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
