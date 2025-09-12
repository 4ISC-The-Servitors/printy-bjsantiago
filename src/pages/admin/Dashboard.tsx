import React from 'react';
import { OrdersCard, TicketsCard } from '../../components/admin/dashboard';

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <OrdersCard />
      <TicketsCard />
    </div>
  );
};

export default AdminDashboard;
