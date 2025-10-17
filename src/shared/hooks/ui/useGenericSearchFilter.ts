import { useMemo, useState } from 'react';
import type { FilterValue, FilterConfig } from '@shared/types';

export interface SearchableItem {
  [key: string]: any;
}

export interface UseGenericSearchFilterOptions<T extends SearchableItem> {
  items: T[];
  searchFields: (keyof T)[];
  dateField?: keyof T; // Field to use for date filtering (e.g., 'created_at')
  filterConfig: FilterConfig;
  statusField?: keyof T; // Field to use for status filtering (defaults to 'status')
  roleField?: keyof T; // Field to use for role filtering (defaults to 'customer_type')
}

export function useGenericSearchFilter<T extends SearchableItem>({
  items,
  searchFields,
  dateField = 'created_at' as keyof T,
  filterConfig,
  statusField = 'status' as keyof T,
  roleField = 'customer_type' as keyof T,
}: UseGenericSearchFilterOptions<T>) {
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<FilterValue>({ 
    statuses: [],
    roles: filterConfig.roleOptions ? [] : undefined,
  });

  // Normalize items for searching
  const normalized = useMemo(() => {
    return (items || []).map(item => {
      const searchableFields = searchFields
        .map(field => {
          const value = item[field];
          if (typeof value === 'string') return value;
          if (typeof value === 'number') return value.toString();
          if (value && typeof value === 'object') {
            // Handle nested objects or arrays
            return JSON.stringify(value);
          }
          return '';
        })
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return { raw: item, haystack: searchableFields };
    });
  }, [items, searchFields]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const hasDateFrom = !!filter.dateFrom;
    const hasDateTo = !!filter.dateTo;
    const fromTime = hasDateFrom ? new Date(filter.dateFrom as string).getTime() : undefined;
    const toTime = hasDateTo ? new Date(filter.dateTo as string).getTime() : undefined;

    return normalized
      .filter(({ raw, haystack }) => {
        // Status filter
        if (filterConfig.showStatusFilter && filter.statuses?.length) {
          const itemStatus = raw[statusField];
          if (itemStatus && !filter.statuses.includes(itemStatus.toLowerCase())) {
            return false;
          }
        }

        // Role filter (for customers, etc.)
        if (filterConfig.showRoleFilter && filter.roles?.length) {
          const itemRole = raw[roleField];
          if (itemRole && !filter.roles.includes(itemRole.toLowerCase())) {
            return false;
          }
        }

        // Date range filter
        if ((hasDateFrom || hasDateTo) && dateField && raw[dateField]) {
          const itemDate = new Date(raw[dateField]).getTime();
          if (fromTime !== undefined && itemDate < fromTime) return false;
          if (toTime !== undefined && itemDate > toTime) return false;
        }

        // Search query
        if (q && !haystack.includes(q)) return false;
        
        return true;
      })
      .map(x => x.raw);
  }, [normalized, search, filter, filterConfig, dateField, statusField, roleField]);

  const activeCount = useMemo(() => {
    let c = 0;
    if (search.trim()) c += 1;
    if (filter.statuses?.length) c += filter.statuses.length;
    if (filter.roles?.length) c += filter.roles.length;
    if (filter.dateFrom) c += 1;
    if (filter.dateTo) c += 1;
    return c;
  }, [search, filter]);

  const resetAll = () => {
    setSearch('');
    setFilter({ 
      statuses: [],
      roles: filterConfig.roleOptions ? [] : undefined,
    });
  };

  return {
    search,
    setSearch,
    filter,
    setFilter,
    activeCount,
    resetAll,
    filteredItems,
    filterConfig,
  } as const;
}

export default useGenericSearchFilter;
