import React from 'react';
import QuoteHistory from '@customer/components/dashboard/quoteHistory/QuoteHistory';
import { CustomerConversationsProvider } from '@features/chat/hooks/customer/CustomerConversationsProvider';

const CustomerQuoteHistory: React.FC = () => {
  return (
    <CustomerConversationsProvider>
      <QuoteHistory />
    </CustomerConversationsProvider>
  );
};

export default CustomerQuoteHistory;
