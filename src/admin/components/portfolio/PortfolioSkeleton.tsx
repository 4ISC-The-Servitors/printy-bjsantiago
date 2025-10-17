import React from 'react';
import { Card } from '@admin/components/shared';

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
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  {/* Service name skeleton */}
                  <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                  {/* Status badge skeleton */}
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse mt-2" />
                </div>
              </div>

              {/* Right side: Action button skeleton */}
              <div className="text-right flex-shrink-0 ml-4">
                <div className="h-11 w-11 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
};

export default PortfolioSkeleton;
