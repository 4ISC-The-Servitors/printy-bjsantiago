import React, { createContext, useContext } from 'react';

export type SelectedItem = {
  id: string;
  label: string;
  type?: 'order' | 'ticket' | 'portfolio' | 'service';
};

export interface AdminContextValue {
  selected: SelectedItem[];
  addSelected: (item: SelectedItem) => void;
  removeSelected: (id: string) => void;
  clearSelected: () => void;
  openChat: () => void;
  openChatWithTopic?: (
    topic: string,
    orderId?: string,
    updateItem?: (id: string, updates: any) => void,
    items?: any[],
    refreshItems?: () => void,
    selectedIds?: string[]
  ) => void;
}

export const AdminContext = createContext<AdminContextValue | undefined>(
  undefined
);

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};

export const AdminProvider: React.FC<{
  value: AdminContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};
