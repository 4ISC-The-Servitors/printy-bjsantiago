import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/useToast';
import { startCustomerNotifications } from '../../features/notifications/notificationService';

const CustomerRoot: React.FC = () => {
  const [_, toast] = useToast({ duration: 5000 });

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;

      if (!userId) {
        console.warn('⚠️ No logged-in user, skipping notifications');
        return;
      }

      console.log(`🔔 Starting customer notifications for ${userId}`);
      cleanup = startCustomerNotifications(userId, toast);
    })();

    return () => {
      if (cleanup) cleanup();
    };
  }, [toast]);

  return <Outlet />;
};

export default CustomerRoot;

