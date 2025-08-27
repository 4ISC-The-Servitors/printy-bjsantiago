import React, { useEffect, type FC } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export interface ModalHeaderProps {
  children: React.ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export interface ModalBodyProps {
  children: React.ReactNode;
}

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  // Safety check for document.body
  if (typeof document === 'undefined') return null;

  try {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={handleOverlayClick}
        />

        {/* Modal */}
        <div
          className={`relative w-full ${sizeClasses[size]} animate-in fade-in-0 zoom-in-95 duration-200`}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  } catch (error) {
    console.error('Modal render error:', error);
    return null;
  }
};

const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  showCloseButton = true,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between p-6 pb-4">
      <div className="flex-1">{children}</div>
      {showCloseButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="ml-4 h-8 w-8 p-0 hover:bg-neutral-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      )}
    </div>
  );
};

const ModalBody: React.FC<ModalBodyProps> = ({ children }) => {
  return <div className="px-6 pb-4">{children}</div>;
};

const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-end gap-3 p-6 pt-4 ${className}`}
    >
      {children}
    </div>
  );
};

type ModalCompound = FC<ModalProps> & {
  Header: FC<ModalHeaderProps>;
  Body: FC<ModalBodyProps>;
  Footer: FC<ModalFooterProps>;
};

const ModalTyped = Modal as ModalCompound;
ModalTyped.Header = ModalHeader;
ModalTyped.Body = ModalBody;
ModalTyped.Footer = ModalFooter;

export default ModalTyped;
