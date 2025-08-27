import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'success'
    | 'warning'
    | 'error'
    | 'info';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { variant = 'default', size = 'md', children, className, ...props },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center rounded-full font-medium';

    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          getVariantClasses(variant),
          getSizeClasses(size),
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

const getVariantClasses = (variant: BadgeProps['variant']) =>
  ({
    default: 'bg-neutral-100 text-neutral-800',
    primary: 'bg-brand-primary-100 text-brand-primary-800',
    secondary: 'bg-neutral-200 text-neutral-800',
    accent: 'bg-brand-accent-100 text-brand-accent-800',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-warning-50 text-warning-700',
    error: 'bg-error-50 text-error-700',
    info: 'bg-info-50 text-info-700',
  })[variant || 'default'];

const getSizeClasses = (size: BadgeProps['size']) =>
  ({
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm',
  })[size || 'md'];

export default Badge;
