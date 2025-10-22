import React from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerLayout } from '@customer/components/shared/layouts/CustomerLayout';

const CustomerRoot: React.FC = () => {
  return (
    <CustomerLayout>
      <Outlet />
    </CustomerLayout>
  );
};

export default CustomerRoot;
