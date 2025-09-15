import React from 'react';
import { OrdersDesktopCard, OrdersMobileCard } from '@components/admin';

const AdminOrders: React.FC = () => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="lg:hidden mb-4">
        <OrdersMobileCard />
      </div>
      <div className="hidden lg:block">
        <OrdersDesktopCard />
      </div>
    </div>
  );
};

export default AdminOrders;
