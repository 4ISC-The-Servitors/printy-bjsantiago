import React from 'react';
import { Skeleton } from '../index';
import { Text } from '../index';

const SkeletonShowcase: React.FC = () => {
  return (
    <section className="space-y-6">
      <Text variant="h2" size="2xl" weight="semibold">
        Loading States
      </Text>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </div>
        
        <div className="flex gap-4">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="rectangular" width={200} height={40} />
        </div>
      </div>
    </section>
  );
};

export default SkeletonShowcase;
