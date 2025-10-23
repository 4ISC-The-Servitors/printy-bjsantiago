import React from 'react';
import { cn } from '@lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'ghost'
    | 'success'
    | 'error'
    | 'warning'
    | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  threeD?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const buttonVariants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  ghost: 'btn-ghost',
  success: 'btn-success',
  error: 'btn-error',
  warning: 'btn-warning',
  info: 'btn-info',
} as const;

const buttonSizes = {
  xs: 'device-btn-tertiary',
  sm: 'device-btn-secondary',
  md: 'device-btn-primary',
  lg: 'device-btn-primary',
  xl: 'device-btn-primary',
} as const;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      threeD = false,
      children,
      onClick,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'btn';
    const variantClasses = buttonVariants[variant];
    const sizeClasses = buttonSizes[size];
    const stateClasses =
      disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        onClick={onClick}
        className={cn(
          baseClasses,
          variantClasses,
          sizeClasses,
          stateClasses,
          threeD && 'btn-3d',
          className
        )}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

const LoadingSpinner: React.FC = () => (
  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
);

export default Button;
