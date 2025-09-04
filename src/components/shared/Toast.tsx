import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { Text } from './index';

export interface ToastProps {
  id: string;
  title: string;
  message?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  duration?: number;
  onClose?: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      id,
      title,
      message,
      variant = 'default',
      size = 'md',
      duration = 5000,
      onClose,
      action,
      className,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = useCallback(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.(id);
      }, 200);
    }, [id, onClose]);

    useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [duration, handleClose]);

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'toast',
          getVariantClasses(variant),
          getSizeClasses(size),
          isExiting && 'toast-exit',
          className
        )}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{getVariantIcon(variant)}</div>

          <div className="flex-1 min-w-0">
            <Text
              variant="p"
              size={size === 'sm' ? 'sm' : 'base'}
              weight="medium"
              className="mb-0.5"
            >
              {title}
            </Text>
            {message && (
              <Text variant="p" size="sm" color="muted" className="mb-0">
                {message}
              </Text>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {action && (
              <button
                onClick={action.onClick}
                className="text-sm font-medium text-brand-primary hover:text-brand-primary-900 transition-colors"
              >
                {action.label}
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded"
              aria-label="Close toast"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

const getVariantClasses = (variant: ToastProps['variant']) =>
  ({
    default: 'bg-neutral-0 border-neutral-200 text-neutral-900',
    success: 'bg-success-50 border-success-200 text-success-900',
    error: 'bg-error-50 border-error-200 text-error-900',
    warning: 'bg-warning-50 border-warning-200 text-warning-900',
    info: 'bg-info-50 border-info-200 text-info-900',
  })[variant || 'default'];

const getSizeClasses = (size: ToastProps['size']) =>
  ({
    sm: 'p-3 gap-2',
    md: 'p-4 gap-3',
    lg: 'p-5 gap-4',
  })[size || 'md'];

const getVariantIcon = (variant: ToastProps['variant']) => {
  switch (variant) {
    case 'success':
      return (
        <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    case 'error':
      return (
        <div className="w-5 h-5 rounded-full bg-error flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    case 'warning':
      return (
        <div className="w-5 h-5 rounded-full bg-warning flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    case 'info':
      return (
        <div className="w-5 h-5 rounded-full bg-info flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-5 h-5 rounded-full bg-neutral-300 flex items-center justify-center">
          <svg
            className="w-3 h-3 text-neutral-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
  }
};

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

export default Toast;
