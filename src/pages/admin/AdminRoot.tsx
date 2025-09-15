import React, { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminLayout from '@components/admin/layouts/AdminLayout';
import SelectionProvider from '@hooks/admin/SelectionContext';
import { AdminProvider, type SelectedItem } from '@hooks/admin/AdminContext';

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
      openChat: () => {},
    }),
    [selected]
  );

  return (
    <SelectionProvider>
      <AdminProvider value={adminContextValue}>
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      </AdminProvider>
    </SelectionProvider>
  );
};

export default AdminRoot;
