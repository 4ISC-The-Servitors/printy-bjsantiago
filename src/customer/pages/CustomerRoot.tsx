import React from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerLayout } from '@customer/components/shared/layouts/CustomerLayout';
import { CustomerConversationsProvider } from '@features/chat/hooks/customer/CustomerConversationsProvider';

const CustomerRoot: React.FC = () => {
  return (
    <CustomerConversationsProvider>
      <CustomerLayout>
        <Outlet />
      </CustomerLayout>
    </CustomerConversationsProvider>
  );
};

export default CustomerRoot;
