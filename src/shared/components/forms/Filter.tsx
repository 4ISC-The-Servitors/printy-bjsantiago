import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Button } from '@shared/components/ui';
import { Input } from '@shared/components/ui';
import {
  SlidersHorizontal,
  Calendar,
  ChevronDown,
  X,
  CheckCircle,
} from 'lucide-react';
import {
  useResponsiveClasses,
  useDeviceUtils,
} from '@shared/hooks/ui/useResponsiveClasses';
import type { FilterValue, FilterConfig } from '@shared/types/filters';

export interface FilterProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  filterConfig: FilterConfig;
  className?: string;
  showResultCount?: boolean;
  resultCount?: number;
  floating?: boolean;
}

const Filter: React.FC<FilterProps> = ({
  value,
  onChange,
  filterConfig,
  className,
  showResultCount = false,
  resultCount = 0,
  floating = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Responsive hooks
  const { textClasses, spacingClasses } = useResponsiveClasses();
  const { isMobile } = useDeviceUtils();

  const activeCount = useMemo(() => {
    let c = 0;
    if (value.statuses?.length) c += value.statuses.length;
    if (value.dateFrom) c += 1;
    if (value.dateTo) c += 1;
    return c;
  }, [value]);

  const handleStatusSelect = (status: string) => {
    // For dropdown, replace the current selection instead of toggling
    // If the same status is selected, clear the selection
    if (value.statuses?.includes(status)) {
      onChange({ ...value, statuses: [] });
    } else {
      onChange({ ...value, statuses: [status] });
    }
    setIsStatusDropdownOpen(false);
  };

  const handleRoleSelect = (role: string) => {
    // For dropdown, replace the current selection instead of toggling
    // If the same role is selected, clear the selection
    if (value.roles?.includes(role)) {
      onChange({ ...value, roles: [] });
    } else {
      onChange({ ...value, roles: [role] });
    }
    setIsRoleDropdownOpen(false);
  };

  const reset = () =>
    onChange({
      statuses: [],
      roles: filterConfig.roleOptions ? [] : undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });

  const hasFilters = activeCount > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`${floating ? 'relative' : 'space-y-3'} ${className ?? ''}`}
    >
      {/* Filter Toggle Button */}
      <div className={`flex items-center justify-center`}>
        <Button
          variant={isExpanded ? 'primary' : 'secondary'}
          size="md"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`h-8 sm:h-9 md:h-10 lg:h-11 px-2 sm:px-3 md:px-4 lg:px-5 text-xs sm:text-sm md:text-base lg:text-lg flex items-center justify-center ${isMobile ? 'w-full' : 'flex-none'}`}
        >
          <SlidersHorizontal
            className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${isMobile ? 'mr-1' : 'mr-2'}`}
          />
          <span className="inline">Filters</span>
        </Button>
      </div>

      {/* Results Count */}
      {showResultCount && hasFilters && (
        <div className={textClasses.body}>
          Found{' '}
          <span className="font-semibold text-neutral-900">{resultCount}</span>{' '}
          {resultCount === 1 ? 'order' : 'orders'}
        </div>
      )}

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div
          className={`bg-white border border-neutral-200 rounded-xl shadow-lg ${floating ? 'p-4 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-5 md:space-y-6' : spacingClasses.padding + ' ' + spacingClasses.gap} animate-in fade-in slide-in-from-top-2 duration-200 ${
            floating
              ? 'absolute top-full left-0 mt-2 w-80 sm:w-96 md:w-[28rem] lg:w-[32rem] xl:w-[36rem] z-50'
              : ''
          }`}
        >
          {/* Close Button - Only show in floating mode, positioned absolutely */}
          {floating && (
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-5 md:right-5 lg:top-6 lg:right-6 p-1 hover:bg-neutral-100 rounded-full transition-colors z-10"
              aria-label="Close filters"
            >
              <X className="w-4 h-4 text-neutral-500 hover:text-neutral-700" />
            </button>
          )}
          {/* Date Range Section */}
          {filterConfig.showDateRange && (
            <div className="space-y-2 sm:space-y-3">
              <div
                className={`flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg font-medium text-neutral-700`}
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                Date Range
              </div>
              <div
                className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6`}
              >
                <div className="flex-1">
                  <Input
                    type="date"
                    value={value.dateFrom || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onChange({
                        ...value,
                        dateFrom: e.target.value || undefined,
                      })
                    }
                    aria-label="Filter from date"
                    className="h-8 sm:h-9 md:h-10 lg:h-11 text-xs sm:text-sm md:text-base"
                  />
                </div>
                <span className="text-neutral-400 text-xs sm:text-sm md:text-base text-center sm:text-center flex-shrink-0 px-4">
                  to
                </span>
                <div className="flex-1">
                  <Input
                    type="date"
                    value={value.dateTo || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onChange({
                        ...value,
                        dateTo: e.target.value || undefined,
                      })
                    }
                    aria-label="Filter to date"
                    className="h-8 sm:h-9 md:h-10 lg:h-11 text-xs sm:text-sm md:text-base"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Status Filter Section */}
          {filterConfig.showStatusFilter &&
            filterConfig.statusOptions.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <div
                  className={`flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg font-medium text-neutral-700`}
                >
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  Status
                </div>
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    type="button"
                    onClick={() =>
                      setIsStatusDropdownOpen(!isStatusDropdownOpen)
                    }
                    className="w-full flex items-center justify-between h-8 sm:h-9 md:h-10 lg:h-11 px-2 sm:px-3 md:px-4 text-xs sm:text-sm md:text-base bg-white border border-neutral-300 rounded-lg hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <span className="text-neutral-700">
                      {value.statuses?.length > 0
                        ? filterConfig.statusOptions.find(
                            opt => opt.value === value.statuses[0]
                          )?.label || 'Select status'
                        : 'Select status'}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-neutral-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-48 sm:max-h-56 md:max-h-64 overflow-y-auto">
                      {filterConfig.statusOptions.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleStatusSelect(opt.value)}
                          className={`w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-left text-xs sm:text-sm md:text-base hover:bg-neutral-50 ${
                            value.statuses?.includes(opt.value)
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-neutral-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Role/Priority Filter Section */}
          {filterConfig.showRoleFilter &&
            filterConfig.roleOptions &&
            filterConfig.roleOptions.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <div
                  className={`text-xs sm:text-sm md:text-base lg:text-lg font-medium text-neutral-700`}
                >
                  {filterConfig.roleOptions[0]?.value.includes('role')
                    ? 'Customer Role'
                    : 'Role'}
                </div>
                <div className="relative" ref={roleDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className="w-full flex items-center justify-between h-8 sm:h-9 md:h-10 lg:h-11 px-2 sm:px-3 md:px-4 text-xs sm:text-sm md:text-base bg-white border border-neutral-300 rounded-lg hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <span className="text-neutral-700">
                      {value.roles && value.roles.length > 0
                        ? filterConfig.roleOptions!.find(
                            opt => opt.value === value.roles![0]
                          )?.label || 'Select role'
                        : 'Select role'}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-neutral-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isRoleDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-48 sm:max-h-56 md:max-h-64 overflow-y-auto">
                      {filterConfig.roleOptions!.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleRoleSelect(opt.value)}
                          className={`w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-left text-xs sm:text-sm md:text-base hover:bg-neutral-50 ${
                            value.roles?.includes(opt.value)
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-neutral-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Clear All Filters */}
          {activeCount > 0 && (
            <div className="pt-2 sm:pt-3 md:pt-4 border-t border-neutral-200">
              <button
                onClick={reset}
                className="text-xs sm:text-sm md:text-base text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Filter;
