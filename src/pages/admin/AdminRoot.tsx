import React, { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminLayout from '@components/admin/layouts/AdminLayout';
import SelectionProvider from '@hooks/admin/SelectionContext';
import { AdminProvider, type SelectedItem } from '@hooks/admin/AdminContext';
import { AdminConversationsProvider } from '@hooks/admin/useAdminConversations';

const AdminRoot: React.FC = () => {
  const [selected, setSelected] = useState<SelectedItem[]>([]);

  const adminContextValue = useMemo(
    () => ({
      selected,
      addSelected: (item: SelectedItem) =>
        setSelected(prev =>
          prev.find(i => i.id === item.id) ? prev : [...prev, item]
        ),
      removeSelected: (id: string) =>
        setSelected(prev => prev.filter(i => i.id !== id)),
      clearSelected: () => setSelected([]),
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
    [selected]
  );

  return (
    <SelectionProvider>
      <AdminConversationsProvider>
        <AdminProvider value={adminContextValue}>
          <AdminLayout>
            <Outlet />
          </AdminLayout>
        </AdminProvider>
      </AdminConversationsProvider>
    </SelectionProvider>
  );
};

export default AdminRoot;
