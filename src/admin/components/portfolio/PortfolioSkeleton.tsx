import React from 'react';
import { Card, Skeleton } from '@admin/components/shared';

/**
 * PortfolioSkeleton Component
 *
 * Loading skeleton for the Portfolio page showing service items.
 * Updated to use the Skeleton component instead of raw animate-pulse.
 *
 * Features:
 * - Consistent with design system using Skeleton component
 * - Matches actual service item structure
 * - Includes pagination skeleton
 * - Follows UX guidelines from loading-states.md
 */
export const PortfolioSkeleton: React.FC = () => {
  return (
    <div className="relative">
      <Card className="p-0">
        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="relative flex items-center justify-between p-6 border border-gray-200 rounded-lg min-h-[80px]"
            >
              {/* Left side: Service info */}
              <div className="flex items-center gap-4 min-w-0 flex-1 pl-6">
                <div className="min-w-0 flex-1 space-y-2">
                  {/* Service code skeleton */}
                  <Skeleton variant="text" width="80px" height="16px" />
                  {/* Service name skeleton */}
                  <Skeleton variant="text" width="192px" height="20px" />
                  {/* Status badge skeleton */}
                  <div className="mt-2">
                    <Skeleton
                      variant="rectangular"
                      width="80px"
                      height="24px"
                      className="rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Right side: Action button skeleton */}
              <div className="text-right flex-shrink-0 ml-4">
                <Skeleton
                  variant="rectangular"
                  width="44px"
                  height="44px"
                  className="rounded-lg"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <Skeleton
          variant="rectangular"
          width="96px"
          height="40px"
          className="rounded"
        />
        <div className="flex gap-2">
          <Skeleton
            variant="rectangular"
            width="40px"
            height="40px"
            className="rounded"
          />
          <Skeleton
            variant="rectangular"
            width="40px"
            height="40px"
            className="rounded"
          />
        </div>
        <Skeleton
          variant="rectangular"
          width="96px"
          height="40px"
          className="rounded"
        />
      </div>
    </div>
  );
};

export default PortfolioSkeleton;
