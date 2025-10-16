import React from 'react';
import { Card, Skeleton } from '@admin/components/shared';

export const TicketsSkeleton: React.FC = () => {
  return (
    <div className="relative">
      <Card className="p-0">
        <div className="flex items-center justify-end px-3 py-2 sm:px-4">
          <Skeleton variant="rectangular" width="40px" height="20px" />
        </div>
        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 rounded-lg border bg-white/60"
            >
              <Skeleton variant="circular" width="16px" height="16px" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton variant="text" width="100px" height="16px" />
                  <Skeleton variant="text" width="120px" height="16px" />
                </div>
                <Skeleton variant="text" width="80px" height="14px" />
                <Skeleton variant="text" width="140px" height="16px" />
                <Skeleton variant="rectangular" width="60px" height="20px" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton variant="rectangular" width="32px" height="32px" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TicketsSkeleton;
