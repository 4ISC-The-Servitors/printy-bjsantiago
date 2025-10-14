import React from 'react';
import { Card, Skeleton } from '../../shared';

const QuotesSkeleton: React.FC = () => {
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between px-3 py-2 sm:px-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-8" />
      </div>

      <div className="space-y-4 px-3 sm:px-4 pb-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="p-4 border border-neutral-200 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default QuotesSkeleton;
