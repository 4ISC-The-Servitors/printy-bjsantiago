import React from 'react';
import { Badge } from '@shared/components';
import { formatShortDate } from '@shared/utils/dateFormatter';
import { formatRelativeTimeLabel } from '@shared/utils/timeFormatter';
import { useResponsiveLayout, useResponsiveClasses } from '@shared/hooks/ui';
import {
  formatOrderStatus,
  formatTicketStatus,
  formatQuoteStatus,
  formatChatStatus,
} from '@shared/utils';
import {
  getOrderStatusBadgeVariant,
  getTicketStatusBadgeVariant,
  getQuoteStatusBadgeVariant,
  getChatStatusBadgeVariant,
} from '@shared/utils/statusColors';

interface HistoryItemCardProps {
  type: 'order' | 'ticket' | 'quote' | 'chat';
  displayId: string;
  title: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>; // Additional metadata to display
  actions?: React.ReactNode; // Action buttons (e.g., Pay Now, Track)
  onClick?: () => void;
  className?: string;
}

/**
 * Consistent card component for all history items
 * Matches the RecentOrder.tsx layout structure
 *
 * Features:
 * - Unified design across order, ticket, quote, and chat history
 * - Displays ID, title, status badge, dates
 * - Optional metadata section
 * - Action button slots
 * - Hover states and transitions
 * - Touch-friendly (44x44px minimum)
 * - Responsive layout using useResponsiveLayout
 *
 * Usage:
 * ```tsx
 * <HistoryItemCard
 *   type="order"
 *   displayId="ORD-12345"
 *   title="Business Cards - Premium"
 *   status="awaiting_payment"
 *   createdAt={timestamp}
 *   updatedAt={timestamp}
 *   metadata={{ total: '₱2,500' }}
 *   actions={<PayNowButton />}
 *   onClick={() => handleClick()}
 * />
 * ```
 */
const HistoryItemCard: React.FC<HistoryItemCardProps> = ({
  type,
  displayId,
  title,
  status,
  createdAt,
  updatedAt,
  metadata,
  actions,
  onClick,
  className = '',
}) => {
  const { getOrderCardLayout } = useResponsiveLayout();
  const { textClasses } = useResponsiveClasses();
  const layout = getOrderCardLayout;

  // Get badge variant using proper utility functions
  const getBadgeVariant = () => {
    switch (type) {
      case 'order':
        return getOrderStatusBadgeVariant(status);
      case 'ticket':
        return getTicketStatusBadgeVariant(status);
      case 'quote':
        return getQuoteStatusBadgeVariant(status);
      case 'chat':
        // Chat statuses - use chat status utility
        return getChatStatusBadgeVariant(status);
      default:
        return 'secondary';
    }
  };

  const badgeVariant = getBadgeVariant();

  // Get formatted status text using proper utility functions
  const getFormattedStatus = () => {
    switch (type) {
      case 'order':
        return formatOrderStatus(status);
      case 'ticket':
        return formatTicketStatus(status);
      case 'quote':
        return formatQuoteStatus(status);
      case 'chat':
        return formatChatStatus(status);
      default:
        return status;
    }
  };

  return (
    <div
      className={`
        group device-spacing-component rounded-lg border bg-white/60 hover:bg-white transition-colors
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Row 1: Display ID • Title | Status Badge */}
      <div className={layout.structure.row1}>
        <div className={layout.leftSection}>
          <div className={`flex items-center ${layout.elementGap} min-w-0`}>
            <span className={`${layout.orderId} device-text-fraunces`}>
              {displayId}
            </span>
            {title ? (
              <>
                <span className="text-neutral-400">•</span>
                <span className={layout.productName}>{title}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className={layout.badgeContainer}>
          <Badge
            variant={badgeVariant}
            size="md"
            className={layout.statusBadge}
          >
            {getFormattedStatus()}
          </Badge>
        </div>
      </div>

      {/* Row 2: Amount only */}
      {metadata?.total && (
        <div className={layout.structure.row2}>
          <div className={layout.leftSection} />
          <div className={layout.rightSection}>
            <div className={layout.amount}>{metadata.total}</div>
          </div>
        </div>
      )}

      {/* Row 3: Action buttons - bottom-right only */}
      {actions && (
        <div className="flex justify-end mt-3">
          <div onClick={e => e.stopPropagation()}>{actions}</div>
        </div>
      )}

      {/* Row 4: Dates (stacked) */}
      <div className="mt-1">
        <div
          className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
        >
          <span className="font-medium">Created:</span>
          <span className="truncate">{formatShortDate(createdAt)}</span>
        </div>
        <div
          className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
        >
          <span className="font-medium">{type === 'chat' ? 'Ended:' : 'Updated:'}</span>
          <span className="truncate">{formatRelativeTimeLabel(updatedAt)}</span>
        </div>
        {metadata?.['payment verified'] && (
          <div
            className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
          >
            <span className="font-medium">Payment Verified:</span>
            <span className="truncate">{metadata['payment verified']}</span>
          </div>
        )}
        {metadata?.completed && (
          <div
            className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
          >
            <span className="font-medium">Completed:</span>
            <span className="truncate">{metadata.completed}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryItemCard;
