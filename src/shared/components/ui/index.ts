/**
 * Shared UI Components
 * Base components used across all roles (admin, customer, guest)
 */

export { default as Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { default as Button } from './Button';
export type { ButtonProps } from './Button';

export { default as Card } from './Card';
export type { CardProps } from './Card';

export { default as Input } from './Input';
export type { InputProps } from './Input';

export { default as Modal } from './Modal';
export type {
  ModalProps,
  ModalHeaderProps,
  ModalBodyProps,
  ModalFooterProps,
} from './Modal';

export { default as Pagination } from './Pagination';

export { default as Skeleton } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

export { default as Switch } from './Switch';
export type { SwitchProps } from './Switch';

export { default as Text } from './Text';
export type { TextProps } from './Text';

export { default as Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';

export { default as MarkAllReadButton } from './MarkAllReadButton';
export { default as DeleteAllNotificationsButton } from './DeleteAllNotificationsButton';

export { default as AuditInfoModal } from './AuditInfoModal';
export { default as CustomerInfoModal } from './CustomerInfoModal';
