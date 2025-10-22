import React, { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminLayout } from '@admin/components/shared/layouts';
import { AdminProvider } from '@admin/hooks/AdminContext';
import { AdminConversationsProvider } from '@admin/hooks/useAdminConversations';

const AdminRoot: React.FC = () => {
  const adminContextValue = useMemo(
    () => ({
      openChat: () => {
        window.dispatchEvent(new CustomEvent('admin-chat-open'));
      },
      openChatWithTopic: (
        topic: string,
        orderId?: string,
        updateOrder?: (orderId: string, updates: any) => void,
        orders?: any[],
        refreshOrders?: () => void,
        orderIds?: string[]
      ) => {
        window.dispatchEvent(
          new CustomEvent('admin-chat-open', {
            detail: {
              topic,
              orderId,
              updateOrder,
              orders,
              refreshOrders,
              orderIds,
            },
          })
        );
      },
    }),
    []
  );

  return (
    <AdminConversationsProvider>
      <AdminProvider value={adminContextValue}>
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      </AdminProvider>
    </AdminConversationsProvider>
  );
};

export default AdminRoot;
