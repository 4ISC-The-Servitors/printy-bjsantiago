// BACKEND_TODO: Replace any ticket mock usage in downstream components with Supabase data.
// Wire realtime subscriptions for ticket status/messages.
import React from 'react';
import { TicketsDesktopCard, TicketsMobileCard } from '@components/admin';

const AdminTickets: React.FC = () => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="lg:hidden mb-4">
        <TicketsMobileCard />
      </div>
      <div className="hidden lg:block">
        <TicketsDesktopCard />
      </div>
    </div>
  );
};

export default AdminTickets;
