import React from 'react';
import { cn } from '../../lib/utils';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  as?: React.ElementType;
  threeD?: boolean;
  children: React.ReactNode;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      size = '2xl',
      as: Component = 'div',
      threeD = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'w-full mx-auto px-4 sm:px-6 lg:px-8',
          getSizeClasses(size),
          threeD && 'container-3d',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Container.displayName = 'Container';

const getSizeClasses = (size: ContainerProps['size']) =>
  ({
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-4xl',
    full: 'max-w-full',
  })[size || '2xl'];

export default Container;
