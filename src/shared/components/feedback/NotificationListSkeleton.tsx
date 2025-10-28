import React from 'react';
import { Skeleton } from '@shared/components';

interface NotificationListSkeletonProps {
  /**
   * Number of notification items to display
   * @default 5
   */
  itemCount?: number;
}

/**
 * NotificationListSkeleton Component
 *
 * Loading skeleton for notification lists in admin dashboard.
 * Matches the structure of notification cards with title, message, and timestamp.
 *
 * Features:
 * - Responsive text sizing
 * - Alternating read/unread visual state (subtle background variation)
 * - Follows UX guidelines from loading-states.md
 *
 * @example
 * // Use inside a Card component
 * <Card className="p-6">
 *   <NotificationListSkeleton itemCount={8} />
 * </Card>
 */
export const NotificationListSkeleton: React.FC<
  NotificationListSkeletonProps
> = ({ itemCount = 5 }) => {
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Skeleton variant="text" width="140px" height="28px" />
        <Skeleton variant="text" width="120px" height="16px" />
      </div>

      {/* Notification items */}
      <div className="space-y-3">
        {[...Array(itemCount)].map((_, i) => (
          <div
            key={i}
            className={`p-4 border border-gray-200 rounded-lg ${
              i % 3 === 0 ? 'bg-blue-50/30' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-2">
                {/* Title and unread indicator */}
                <div className="flex items-center gap-2">
                  <Skeleton
                    variant="text"
                    width={`${120 + i * 15}px`}
                    height="16px"
                  />
                  {i % 3 === 0 && (
                    <Skeleton variant="circular" width="8px" height="8px" />
                  )}
                </div>

                {/* Message */}
                <Skeleton
                  variant="text"
                  width={`${200 + i * 25}px`}
                  height="14px"
                />
                <Skeleton
                  variant="text"
                  width={`${180 + i * 20}px`}
                  height="14px"
                />

                {/* Timestamp */}
                <Skeleton
                  variant="text"
                  width={`${90 + i * 10}px`}
                  height="12px"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default NotificationListSkeleton;
