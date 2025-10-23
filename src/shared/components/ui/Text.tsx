import React from 'react';
import { cn } from '@lib/utils';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  size?:
    | 'xs'
    | 'sm'
    | 'base'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?:
    | 'default'
    | 'muted'
    | 'primary'
    | 'accent'
    | 'error'
    | 'success'
    | 'warning'
    | 'info';
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
  children: React.ReactNode;
  as?: React.ElementType;
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      variant = 'p',
      size = 'base',
      weight = 'normal',
      color = 'default',
      align = 'left',
      truncate = false,
      children,
      as,
      className,
      ...props
    },
    ref
  ) => {
    const Component = (as || variant) as React.ElementType;
    const classes = cn(
      getSizeClasses(size),
      getWeightClasses(weight),
      getColorClasses(color),
      getAlignClasses(align),
      truncate && 'truncate',
      variant.startsWith('h') && 'font-heading',
      variant === 'p' && 'font-body',
      className
    );

    return (
      <Component
        ref={ref as React.Ref<HTMLElement>}
        className={classes}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';

const getSizeClasses = (size: TextProps['size']) =>
  ({
    xs: 'device-text-caption',
    sm: 'device-text-caption',
    base: 'device-text-body',
    lg: 'device-text-body',
    xl: 'device-text-heading',
    '2xl': 'device-text-heading',
    '3xl': 'device-text-hero',
    '4xl': 'device-text-hero',
    '5xl': 'device-text-display',
    '6xl': 'device-text-display',
    '7xl': 'device-text-display',
  })[size || 'base'];

const getWeightClasses = (weight: TextProps['weight']) =>
  ({
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
  })[weight || 'normal'];

const getColorClasses = (color: TextProps['color']) =>
  ({
    default: 'text-neutral-700',
    muted: 'text-neutral-500',
    primary: 'text-brand-primary',
    accent: 'text-brand-accent',
    error: 'text-error',
    success: 'text-success',
    warning: 'text-warning',
    info: 'text-info',
  })[color || 'default'];

const getAlignClasses = (align: TextProps['align']) =>
  ({
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  })[align || 'left'];

export default Text;
