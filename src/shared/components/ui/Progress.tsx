'use client';

import React from 'react';
import { cn } from '@lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0-100
}

// shadcn/ui-compatible Progress
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full h-2 overflow-hidden rounded-full bg-neutral-200',
          className
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full flex-1 rounded-full bg-brand-primary transition-[width] duration-200'
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export default Progress;
