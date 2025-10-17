import React from 'react';
import { Card, Skeleton } from '@admin/components/shared';
import { useResponsiveLayout } from '@shared/hooks/ui';

export const OrdersSkeleton: React.FC = () => {
  const { getCardLayout } = useResponsiveLayout();
  const layout = getCardLayout;
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
              className={`flex items-center gap-3 sm:gap-4 ${layout.container}`}
            >
              <Skeleton variant="circular" width="16px" height="16px" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton variant="text" width="120px" height="16px" />
                  <Skeleton variant="text" width="100px" height="16px" />
                </div>
                <Skeleton variant="text" width="150px" height="14px" />
                <div className="flex gap-2">
                  <Skeleton
                    variant="rectangular"
                    width="60px"
                    height="20px"
                  />
                  <Skeleton
                    variant="rectangular"
                    width="80px"
                    height="20px"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right space-y-1">
                  <Skeleton variant="text" width="80px" height="16px" />
                  <Skeleton variant="text" width="60px" height="14px" />
                </div>
                <Skeleton variant="rectangular" width="32px" height="32px" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default OrdersSkeleton;
