import React from 'react';
import OrderHistory from '@customer/components/dashboard/orderHistory/OrderHistory';
import { CustomerConversationsProvider } from '@features/chat/hooks/customer/CustomerConversationsProvider';

const CustomerOrderHistory: React.FC = () => {
  return (
    <CustomerConversationsProvider>
      <OrderHistory />
    </CustomerConversationsProvider>
  );
};

export default CustomerOrderHistory;
