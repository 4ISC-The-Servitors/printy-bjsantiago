import React, { useCallback } from 'react';
import { cn } from '../../lib/utils';
import Toast from './Toast';
import type { ToastData } from '../../lib/useToast';

export interface ToastContainerProps {
  toasts: ToastData[];
  onRemoveToast: (id: string) => void;
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  className?: string;
}

const ToastContainer = React.forwardRef<HTMLDivElement, ToastContainerProps>(
  (
    {
      toasts,
      onRemoveToast,
      position = 'top-right',
      className,
      ...props
    },
    ref
  ) => {
    const handleClose = useCallback((id: string) => {
      onRemoveToast(id);
    }, [onRemoveToast]);

    if (toasts.length === 0) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'fixed z-50 flex flex-col gap-3 p-4 pointer-events-none',
          getPositionClasses(position),
          className
        )}
        {...props}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              {...toast}
              onClose={handleClose}
            />
          </div>
        ))}
      </div>
    );
  }
);

ToastContainer.displayName = 'ToastContainer';

const getPositionClasses = (position: ToastContainerProps['position']) => {
  switch (position) {
    case 'top-left':
      return 'top-0 left-0';
    case 'top-right':
      return 'top-0 right-0';
    case 'top-center':
      return 'top-0 left-1/2 transform -translate-x-1/2';
    case 'bottom-left':
      return 'bottom-0 left-0';
    case 'bottom-right':
      return 'bottom-0 right-0';
    case 'bottom-center':
      return 'bottom-0 left-1/2 transform -translate-x-1/2';
    default:
      return 'top-0 right-0';
  }
};

export default ToastContainer;
