import React from 'react';
import TicketHistory from '@customer/components/dashboard/ticketHistory/TicketHistory';
import { CustomerConversationsProvider } from '@features/chat/hooks/customer/CustomerConversationsProvider';

const CustomerTicketHistory: React.FC = () => {
  return (
    <CustomerConversationsProvider>
      <TicketHistory />
    </CustomerConversationsProvider>
  );
};

export default CustomerTicketHistory;
