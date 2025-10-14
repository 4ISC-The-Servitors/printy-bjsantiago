// BACKEND_TODO: Ensure OrdersProvider is wired to Supabase (queries + realtime).
// This page should not depend on mock data once backend is live.
import React from 'react';
import { OrdersCard } from '@components/admin';
import { OrdersProvider } from '../../hooks/admin/OrdersContext';

const AdminOrders: React.FC = () => {
  return (
    <OrdersProvider>
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <OrdersCard />
      </div>
    </OrdersProvider>
  );
};

export default AdminOrders;
