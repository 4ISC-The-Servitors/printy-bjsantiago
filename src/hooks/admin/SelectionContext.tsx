import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useSelection } from './useSelection';
import type { SelectionItem } from './useSelection';

export type SelectionEntity = 'order' | 'ticket' | 'service';

interface SelectionContextValue {
  orderSelection: ReturnType<typeof useSelection>;
  ticketSelection: ReturnType<typeof useSelection>;
  serviceSelection: ReturnType<typeof useSelection>;
  globalSelection: {
    selected: SelectionItem[];
    selectedIds: string[];
    hasSelections: boolean;
    selectionCount: number;
    clearAll: () => void;
    getSummary: () => string;
  };
  addToChat: (entityType: SelectionEntity) => void;
  openChat: () => void;
}

const SelectionContext = createContext<SelectionContextValue | undefined>(
  undefined
);

interface SelectionProviderProps {
  children: ReactNode;
  onAddToChat?: (items: SelectionItem[], entityType: SelectionEntity) => void;
  onOpenChat?: () => void;
}

export const SelectionProvider: React.FC<SelectionProviderProps> = ({
  children,
  onAddToChat,
  onOpenChat,
}) => {
  const orderSelection = useSelection({ entityType: 'order', maxSelections: 5, allowMixedTypes: false });
  const ticketSelection = useSelection({ entityType: 'ticket', maxSelections: 5, allowMixedTypes: false });
  const serviceSelection = useSelection({ entityType: 'service', maxSelections: 10, allowMixedTypes: false });

  const allSelected = [
    ...orderSelection.selected,
    ...ticketSelection.selected,
    ...serviceSelection.selected,
  ];

  const globalSelection = {
    selected: allSelected,
    selectedIds: allSelected.map(item => item.id),
    hasSelections: allSelected.length > 0,
    selectionCount: allSelected.length,
    clearAll: () => {
      orderSelection.clear();
      ticketSelection.clear();
      serviceSelection.clear();
    },
    getSummary: () => {
      if (allSelected.length === 0) return 'No items selected';
      const typeCounts = allSelected.reduce(
        (acc, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        },
        {} as Record<SelectionEntity, number>
      );
      const summary = Object.entries(typeCounts)
        .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
        .join(', ');
      return `${allSelected.length} item${allSelected.length > 1 ? 's' : ''} selected (${summary})`;
    },
  };

  const addToChat = (entityType: SelectionEntity) => {
    let items: SelectionItem[] = [];
    switch (entityType) {
      case 'order':
        items = orderSelection.selected; orderSelection.clear(); break;
      case 'ticket':
        items = ticketSelection.selected; ticketSelection.clear(); break;
      case 'service':
        items = serviceSelection.selected; serviceSelection.clear(); break;
    }
    if (items.length > 0 && onAddToChat) onAddToChat(items, entityType);
  };

  const openChat = () => { onOpenChat?.(); };

  const value: SelectionContextValue = {
    orderSelection,
    ticketSelection,
    serviceSelection,
    globalSelection,
    addToChat,
    openChat,
  };

  return (
    <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
  );
};

export const useSelectionContext = () => {
  const context = useContext(SelectionContext);
  if (!context) throw new Error('useSelectionContext must be used within a SelectionProvider');
  return context;
};

export const useOrderSelection = () => useSelectionContext().orderSelection;
export const useTicketSelection = () => useSelectionContext().ticketSelection;
export const useServiceSelection = () => useSelectionContext().serviceSelection;
export const useGlobalSelection = () => useSelectionContext().globalSelection;

export default SelectionProvider;


