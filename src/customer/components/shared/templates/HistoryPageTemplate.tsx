import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Text, Button, Input } from '@shared/components';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  label: string;
  options: FilterOption[];
}

interface HistoryPageTemplateProps {
  title: string;
  subtitle: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterConfig?: FilterConfig;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  items: Array<any>;
  renderItem: (item: any) => React.ReactNode;
  emptyMessage?: string;
  emptyFilteredMessage?: string;
  showBackButton?: boolean;
  backButtonPath?: string;
  headerActions?: React.ReactNode; // Additional header actions
}

/**
 * Standardized template for all history pages
 *
 * Features:
 * - Consistent page header with back button
 * - Search input with placeholder
 * - Filter dropdown (optional)
 * - Clear filters button
 * - Empty states for no items vs no filtered results
 * - Responsive grid/list layout
 * - Loading states support
 *
 * Usage:
 * ```tsx
 * <HistoryPageTemplate
 *   title="Order History"
 *   subtitle="View all your past orders"
 *   searchPlaceholder="Search orders..."
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   filterConfig={{
 *     label: "Status",
 *     options: [
 *       { label: "All", value: "" },
 *       { label: "Pending", value: "pending" }
 *     ]
 *   }}
 *   filterValue={filter}
 *   onFilterChange={setFilter}
 *   items={filteredOrders}
 *   renderItem={(order) => <HistoryItemCard {...order} />}
 *   emptyMessage="No orders found"
 * />
 * ```
 */
const HistoryPageTemplate: React.FC<HistoryPageTemplateProps> = ({
  title,
  subtitle,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filterConfig,
  filterValue = '',
  onFilterChange,
  items,
  renderItem,
  emptyMessage = 'No items found.',
  emptyFilteredMessage = 'No items match your filters.',
  showBackButton = true,
  backButtonPath = '/customer',
  headerActions,
}) => {
  const navigate = useNavigate();

  const hasActiveFilters = searchValue || filterValue;
  const isEmpty = items.length === 0;

  const handleClearFilters = () => {
    if (onSearchChange) onSearchChange('');
    if (onFilterChange) onFilterChange('');
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        {showBackButton && (
          <div className="mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(backButtonPath)}
              className="text-neutral-600 hover:text-neutral-900"
            >
              ← Back to Dashboard
            </Button>
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Text
              variant="h1"
              className="device-text-heading text-neutral-900 mb-1"
            >
              {title}
            </Text>
            <Text variant="p" className="device-text-body text-neutral-600">
              {subtitle}
            </Text>
          </div>
          {headerActions && (
            <div className="flex-shrink-0">{headerActions}</div>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      {(onSearchChange || filterConfig) && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            {/* Search Input */}
            {onSearchChange && (
              <Input
                type="search"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={e => onSearchChange(e.target.value)}
                className="device-input w-full"
              />
            )}

            {/* Filter Dropdown */}
            {filterConfig && onFilterChange && (
              <div className="flex gap-2">
                <select
                  value={filterValue}
                  onChange={e => onFilterChange(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent device-input min-w-[160px]"
                  aria-label={filterConfig.label}
                >
                  {filterConfig.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="whitespace-nowrap"
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="mt-2">
              <Text
                variant="p"
                className="device-text-caption text-neutral-500"
              >
                Showing {items.length} result{items.length !== 1 ? 's' : ''}
              </Text>
            </div>
          )}
        </div>
      )}

      {/* Items List or Empty State */}
      {isEmpty ? (
        <div className="text-center py-12">
          <Text variant="p" className="device-text-body text-neutral-500">
            {hasActiveFilters ? emptyFilteredMessage : emptyMessage}
          </Text>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="mt-4"
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <React.Fragment key={item.id || index}>
              {renderItem(item)}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPageTemplate;
