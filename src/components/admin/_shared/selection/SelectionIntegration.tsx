import React from 'react';
import { SelectionProvider } from '../../../../hooks/admin/SelectionContext';
import { AdminProvider } from '../../../../pages/admin/AdminContext';

interface SelectionIntegrationProps {
  children: React.ReactNode;
  onAddToChat?: (items: any[], entityType: string) => void;
  onOpenChat?: () => void;
}

/**
 * Wrapper component that provides both AdminContext and SelectionContext
 * This ensures compatibility between the legacy system and new selection system
 */
export const SelectionIntegration: React.FC<SelectionIntegrationProps> = ({
  children,
  onAddToChat,
  onOpenChat,
}) => {
  return (
    <AdminProvider
      value={{
        selected: [],
        addSelected: () => {},
        removeSelected: () => {},
        clearSelected: () => {},
        openChat: () => {},
      }}
    >
      <SelectionProvider onAddToChat={onAddToChat} onOpenChat={onOpenChat}>
        {children}
      </SelectionProvider>
    </AdminProvider>
  );
};

export default SelectionIntegration;
