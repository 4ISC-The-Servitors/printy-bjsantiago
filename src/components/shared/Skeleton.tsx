import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'text', width, height, className, ...props }, ref) => {
    const baseClasses = 'skeleton rounded';

    return (
      <div
        ref={ref}
        className={cn(baseClasses, getVariantClasses(variant), className)}
        style={getSkeletonStyle(width, height)}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

const getVariantClasses = (variant: SkeletonProps['variant']) =>
  ({
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'w-full',
  })[variant || 'text'];

const getSkeletonStyle = (
  width?: string | number,
  height?: string | number
) => {
  const style: React.CSSProperties = {};

  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }

  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  return style;
};

export default Skeleton;
