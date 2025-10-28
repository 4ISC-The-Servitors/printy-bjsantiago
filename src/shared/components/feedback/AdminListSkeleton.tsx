import React from 'react';
import { Card, Skeleton } from '@shared/components';
import { useResponsiveLayout } from '@shared/hooks/ui';

interface AdminListSkeletonProps {
  /**
   * Number of skeleton list items to display
   * @default 5
   */
  itemCount?: number;
  /**
   * Whether to show checkbox in each item
   * @default true
   */
  showCheckbox?: boolean;
  /**
   * Whether to show action button in each item
   * @default true
   */
  showAction?: boolean;
}

/**
 * AdminListSkeleton Component
 *
 * Generic reusable loading skeleton for admin list pages (Orders, Quotes, Tickets).
 * Provides a consistent loading experience that matches the actual list item structure.
 *
 * Features:
 * - Responsive layout using useResponsiveLayout hook
 * - Configurable item count
 * - Optional checkbox and action button
 * - Follows UX guidelines from loading-states.md (subtle shimmer, matching layout)
 *
 * @example
 * // Orders page
 * <AdminListSkeleton itemCount={5} showCheckbox={true} />
 *
 * // Quotes page
 * <AdminListSkeleton itemCount={5} showCheckbox={false} />
 */
export const AdminListSkeleton: React.FC<AdminListSkeletonProps> = ({
  itemCount = 5,
  showCheckbox = true,
  showAction = true,
}) => {
  const { getCardLayout } = useResponsiveLayout();
  const layout = getCardLayout;

  return (
    <div className="relative">
      <Card className="p-0">
        {/* Header with badge count skeleton */}
        <div className="flex items-center justify-end px-3 py-2 sm:px-4">
          <Skeleton variant="rectangular" width="40px" height="20px" className="rounded" />
        </div>

        {/* List items */}
        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
          {[...Array(itemCount)].map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 sm:gap-4 ${layout.container}`}
            >
              {/* Optional checkbox */}
              {showCheckbox && (
                <Skeleton variant="circular" width="16px" height="16px" />
              )}

              {/* Main content area */}
              <div className="flex-1 space-y-2">
                {/* ID and title */}
                <div className="flex items-center gap-2">
                  <Skeleton
                    variant="text"
                    width={`${100 + i * 10}px`}
                    height="16px"
                  />
                  <Skeleton
                    variant="text"
                    width={`${120 + i * 15}px`}
                    height="16px"
                  />
                </div>

                {/* Subtitle/description */}
                <Skeleton
                  variant="text"
                  width={`${140 + i * 20}px`}
                  height="14px"
                />

                {/* Status badges */}
                <div className="flex gap-2">
                  <Skeleton
                    variant="rectangular"
                    width={`${60 + i * 5}px`}
                    height="20px"
                    className="rounded"
                  />
                  <Skeleton
                    variant="rectangular"
                    width={`${70 + i * 8}px`}
                    height="20px"
                    className="rounded"
                  />
                </div>
              </div>

              {/* Right side: amount and action */}
              <div className="flex items-center gap-3">
                <div className="text-right space-y-1">
                  <Skeleton
                    variant="text"
                    width={`${70 + i * 10}px`}
                    height="16px"
                  />
                  <Skeleton
                    variant="text"
                    width={`${55 + i * 8}px`}
                    height="14px"
                  />
                </div>

                {/* Optional action button */}
                {showAction && (
                  <Skeleton variant="rectangular" width="32px" height="32px" className="rounded" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminListSkeleton;
