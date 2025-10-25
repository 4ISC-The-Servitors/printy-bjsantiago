import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CustomerLayout } from '@customer/components/shared/layouts/CustomerLayout';
import { SessionCacheProvider } from '@customer/components/shared/cache/SessionCacheProvider';
import { supabase } from '@lib/supabase';

const CustomerRoot: React.FC = () => {
  const [customerId, setCustomerId] = useState<string | undefined>();

  useEffect(() => {
    const getCustomerId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCustomerId(user?.id);
    };
    getCustomerId();
  }, []);

  return (
    <SessionCacheProvider customerId={customerId}>
      <CustomerLayout>
        <Outlet />
      </CustomerLayout>
    </SessionCacheProvider>
  );
};

export default CustomerRoot;
