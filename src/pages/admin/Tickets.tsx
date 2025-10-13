// Admin tickets page with real-time subscriptions and consistent context pattern
import React from 'react';
import { TicketsCard } from '@components/admin';
import { TicketsProvider } from '../../hooks/admin/TicketsContext';

const AdminTickets: React.FC = () => {
  return (
    <TicketsProvider>
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <TicketsCard />
      </div>
    </TicketsProvider>
  );
};

export default AdminTickets;
