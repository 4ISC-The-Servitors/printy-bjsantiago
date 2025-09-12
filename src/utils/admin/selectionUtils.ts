import type { SelectionItem } from '../../hooks/admin/useSelection';
import type { SelectionEntity } from '../../hooks/admin/useSelection';

export const createSelectionItem = (
  id: string,
  label: string,
  type: SelectionEntity,
  data?: any
): SelectionItem => ({ id, label, type, data });

export const createOrderSelectionItems = (
  orders: Array<{ id: string; customer: string; total: string; status: string; [key: string]: any }>
): SelectionItem[] => orders.map(order => createSelectionItem(order.id, `${order.id} - ${order.customer} (${order.total})`, 'order', order));

export const createTicketSelectionItems = (
  tickets: Array<{ id: string; subject: string; status: string; [key: string]: any }>
): SelectionItem[] => tickets.map(ticket => createSelectionItem(ticket.id, `${ticket.id} - ${ticket.subject}`, 'ticket', ticket));

export const createServiceSelectionItems = (
  services: Array<{ id: string; name: string; code: string; status: string; [key: string]: any }>
): SelectionItem[] => services.map(service => createSelectionItem(service.id, `${service.name} (${service.code})`, 'service', service));

export const groupSelectionByType = (items: SelectionItem[]) => {
  return items.reduce(
    (groups, item) => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
      return groups;
    },
    {} as Record<SelectionEntity, SelectionItem[]>
  );
};

export const canMixSelections = (items: SelectionItem[]): boolean => {
  if (items.length <= 1) return true;
  const types = new Set(items.map(item => item.type));
  return types.size === 1;
};

export const getSelectionSummary = (items: SelectionItem[]): string => {
  if (items.length === 0) return 'No items selected';
  const grouped = groupSelectionByType(items);
  const summary = Object.entries(grouped)
    .map(([type, typeItems]) => `${typeItems.length} ${type}${typeItems.length > 1 ? 's' : ''}`)
    .join(', ');
  return `${items.length} item${items.length > 1 ? 's' : ''} selected (${summary})`;
};

export const areAllItemsSelected = (allItems: string[], selectedItems: string[]): boolean => {
  return allItems.length > 0 && allItems.every(id => selectedItems.includes(id));
};

export const areSomeItemsSelected = (allItems: string[], selectedItems: string[]): boolean => {
  return allItems.some(id => selectedItems.includes(id));
};

export const getCheckboxState = (
  allItems: string[],
  selectedItems: string[]
): 'checked' | 'unchecked' | 'indeterminate' => {
  if (areAllItemsSelected(allItems, selectedItems)) return 'checked';
  if (areSomeItemsSelected(allItems, selectedItems)) return 'indeterminate';
  return 'unchecked';
};


