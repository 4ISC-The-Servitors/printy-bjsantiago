import { useState, useCallback } from 'react';

export type SelectionEntity = 'order' | 'ticket' | 'service';

export interface SelectionItem {
  id: string;
  label: string;
  type: SelectionEntity;
  data?: any;
}

export interface UseSelectionOptions {
  entityType: SelectionEntity;
  maxSelections?: number;
  allowMixedTypes?: boolean;
}

export interface UseSelectionReturn {
  selected: SelectionItem[];
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  hasSelections: boolean;
  selectionCount: number;
  select: (item: SelectionItem) => void;
  deselect: (id: string) => void;
  toggle: (item: SelectionItem) => void;
  clear: () => void;
  selectMultiple: (items: SelectionItem[]) => void;
  isSelectionMode: boolean;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  canSelect: (item: SelectionItem) => boolean;
  getSelectionSummary: () => string;
}

export const useSelection = (
  options: UseSelectionOptions
): UseSelectionReturn => {
  const { maxSelections = 10, allowMixedTypes = false } = options;

  const [selected, setSelected] = useState<SelectionItem[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const selectedIds = selected.map(item => item.id);
  const hasSelections = selected.length > 0;
  const selectionCount = selected.length;

  const isSelected = useCallback(
    (id: string) => {
      return selectedIds.includes(id);
    },
    [selectedIds]
  );

  const canSelect = useCallback(
    (item: SelectionItem) => {
      if (isSelected(item.id)) return false;
      if (selected.length >= maxSelections) return false;
      if (!allowMixedTypes && selected.length > 0) {
        const existingType = selected[0].type;
        if (existingType !== item.type) return false;
      }
      return true;
    },
    [selected, maxSelections, allowMixedTypes, isSelected]
  );

  const select = useCallback(
    (item: SelectionItem) => {
      if (!canSelect(item)) return;
      setSelected(prev => [...prev, item]);
    },
    [canSelect]
  );

  const deselect = useCallback((id: string) => {
    setSelected(prev => prev.filter(item => item.id !== id));
  }, []);

  const toggle = useCallback(
    (item: SelectionItem) => {
      if (isSelected(item.id)) {
        deselect(item.id);
      } else {
        select(item);
      }
    },
    [isSelected, deselect, select]
  );

  const clear = useCallback(() => {
    setSelected([]);
  }, []);

  const selectMultiple = useCallback(
    (items: SelectionItem[]) => {
      const validItems = items.filter(canSelect);
      setSelected(prev => [...prev, ...validItems]);
    },
    [canSelect]
  );

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    clear();
  }, [clear]);

  const getSelectionSummary = useCallback(() => {
    if (selected.length === 0) return 'No items selected';

    const typeCounts = selected.reduce(
      (acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      },
      {} as Record<SelectionEntity, number>
    );

    const summary = Object.entries(typeCounts)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ');

    return `${selected.length} item${selected.length > 1 ? 's' : ''} selected (${summary})`;
  }, [selected]);

  return {
    selected,
    selectedIds,
    isSelected,
    hasSelections,
    selectionCount,
    select,
    deselect,
    toggle,
    clear,
    selectMultiple,
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    canSelect,
    getSelectionSummary,
  };
};

export default useSelection;
