import { useState, useCallback, useRef } from 'react';

// Define ToastData locally to avoid circular dependencies
export interface ToastData {
  id: string;
  title: string;
  message?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastOptions {
  duration?: number;
  position?:
    | 'top-left'
    | 'top-right'
    | 'top-center'
    | 'bottom-left'
    | 'bottom-right'
    | 'bottom-center';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastMethods {
  show: (toast: Omit<ToastData, 'id'>) => string;
  success: (title: string, message?: string, options?: ToastOptions) => string;
  error: (title: string, message?: string, options?: ToastOptions) => string;
  warning: (title: string, message?: string, options?: ToastOptions) => string;
  info: (title: string, message?: string, options?: ToastOptions) => string;
  remove: (id: string) => void;
  clear: () => void;
}

export const useToast = (
  defaultOptions: ToastOptions = {}
): [ToastData[], ToastMethods] => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const idCounter = useRef(0);

  const generateId = useCallback(() => {
    idCounter.current += 1;
    return `toast-${idCounter.current}`;
  }, []);

  const show = useCallback(
    (toast: Omit<ToastData, 'id'>) => {
      const id = generateId();
      const newToast: ToastData = {
        ...toast,
        id,
        duration: toast.duration ?? defaultOptions.duration ?? 5000,
      };

      setToasts(prev => [...prev, newToast]);
      return id;
    },
    [defaultOptions.duration, generateId]
  );

  const success = useCallback(
    (title: string, message?: string, options?: ToastOptions) => {
      return show({
        title,
        message,
        variant: 'success',
        ...defaultOptions,
        ...options,
      });
    },
    [show, defaultOptions]
  );

  const error = useCallback(
    (title: string, message?: string, options?: ToastOptions) => {
      return show({
        title,
        message,
        variant: 'error',
        ...defaultOptions,
        ...options,
      });
    },
    [show, defaultOptions]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: ToastOptions) => {
      return show({
        title,
        message,
        variant: 'warning',
        ...defaultOptions,
        ...options,
      });
    },
    [show, defaultOptions]
  );

  const info = useCallback(
    (title: string, message?: string, options?: ToastOptions) => {
      return show({
        title,
        message,
        variant: 'info',
        ...defaultOptions,
        ...options,
      });
    },
    [show, defaultOptions]
  );

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const methods: ToastMethods = {
    show,
    success,
    error,
    warning,
    info,
    remove,
    clear,
  };

  return [toasts, methods];
};
