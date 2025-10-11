// BACKEND_TODO: Replace any ticket mock usage in downstream components with Supabase data.
// Wire realtime subscriptions for ticket status/messages.
import React from 'react';
import { TicketsCard } from '@components/admin';

const AdminTickets: React.FC = () => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <TicketsCard />
    </div>
  );
};

export default AdminTickets;
