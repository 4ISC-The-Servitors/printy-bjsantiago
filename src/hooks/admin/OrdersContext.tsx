import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockOrders, type Order } from '../../data/orders';

interface OrdersContextValue {
  orders: Order[];
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  refreshOrders: () => void;
}

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

export const OrdersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    console.log('updateOrder called:', orderId, updates);

    // Update the reactive state
    setOrders(prevOrders => {
      const newOrders = prevOrders.map(order =>
        order.id === orderId ? { ...order, ...updates } : order
      );
      console.log('Orders updated:', newOrders);
      return newOrders;
    });

    // Also update the mock data for consistency
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      mockOrders[orderIndex] = { ...mockOrders[orderIndex], ...updates };
      console.log('Mock data updated:', mockOrders[orderIndex]);
    }
  };

  const refreshOrders = () => {
    setOrders([...mockOrders]);
  };

  // Refresh orders periodically to catch external changes
  useEffect(() => {
    const interval = setInterval(refreshOrders, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <OrdersContext.Provider value={{ orders, updateOrder, refreshOrders }}>
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
