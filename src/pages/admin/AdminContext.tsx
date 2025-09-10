import React, { createContext, useContext } from 'react';

export type SelectedItem = {
  id: string;
  label: string;
  type?: 'order' | 'ticket' | 'service' | 'other';
};

export type ChatPrefill = {
  text: string;
  role?: 'printy' | 'user';
  skipIntro?: boolean;
  followupBotText?: string;
};

export interface AdminContextValue {
  selected: SelectedItem[];
  addSelected: (item: SelectedItem) => void;
  removeSelected: (id: string) => void;
  clearSelected: () => void;
  openChat: (prefill?: string | ChatPrefill) => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

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
