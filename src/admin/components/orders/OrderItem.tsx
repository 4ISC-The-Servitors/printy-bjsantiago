import React from 'react';
import { Badge, Button } from '@admin/components/shared';
import { getOrderStatusBadgeVariant } from '@shared/utils/statusColors';
import { formatOrderStatus } from '@shared/utils';
import {
  formatOrderDateDesktop,
  formatOrderDateTablet,
  formatOrderDateMobile,
} from '@shared/utils';
import { formatRelativeTimeLabel } from '@shared/utils';
import { MessageSquare } from 'lucide-react';
import type { AdminOrderRow } from '@admin/hooks/useAdminOrders';
// Removed useResponsiveLayout - using device-* classes instead

// Use AdminOrderRow type instead of local Order interface
type Order = AdminOrderRow;

interface OrderItemProps {
  order: Order;
  onHover: (orderId: string | null) => void;
  onViewInChat: (orderId: string) => void;
}

export const OrderItem: React.FC<OrderItemProps> = ({
  order,
  onHover,
  onViewInChat,
}) => {
  // Using device-* classes for responsive layout

  // Show Urgent badge for valued customers
  const showUrgentBadge = order.customer_type === 'valued';

  // Get display ID with fallback to UUID
  const displayId = order.display_id || order.id;

  // Format dates responsively
  const createdDateDesktop = formatOrderDateDesktop(order.created_at);
  const createdDateTablet = formatOrderDateTablet(order.created_at);
  const createdDateMobile = formatOrderDateMobile(order.created_at);

  // Use completed_at if status is 'completed', otherwise use updated_at
  const isCompleted = order.status === 'completed';
  const lastActionDate =
    isCompleted && order.completed_at ? order.completed_at : order.updated_at;
  const lastActionLabel = isCompleted ? 'Completed' : 'Updated';

  // For "Updated" dates, use relative time format; for "Completed" dates, use regular date format
  const useRelativeTime = !isCompleted && lastActionDate;

  const lastActionDateDesktop = useRelativeTime
    ? formatRelativeTimeLabel(lastActionDate)
    : formatOrderDateDesktop(lastActionDate);
  const lastActionDateTablet = useRelativeTime
    ? formatRelativeTimeLabel(lastActionDate)
    : formatOrderDateTablet(lastActionDate);
  const lastActionDateMobile = useRelativeTime
    ? formatRelativeTimeLabel(lastActionDate)
    : formatOrderDateMobile(lastActionDate);

  return (
    <div
      className="group device-spacing-component rounded-lg border bg-white/60 hover:bg-white transition-colors"
      onMouseEnter={() => onHover(order.order_id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Row 1: Order ID + Product Name | Status Badges */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0">
            <span className="device-text-caption font-semibold text-neutral-900 whitespace-nowrap">
              {displayId}
            </span>
            <span className="text-neutral-400">•</span>
            <span className="device-text-caption font-medium text-neutral-700 truncate">
              {order.product_name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
          {showUrgentBadge && (
            <Badge variant="error" className="device-badge-sm">
              Urgent
            </Badge>
          )}
          <Badge
            variant={getOrderStatusBadgeVariant(order.status)}
            className="device-badge-sm"
          >
            {formatOrderStatus(order.status)}
          </Badge>
        </div>
      </div>

      {/* Row 2: Customer Name | Amount */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <span className="device-text-caption font-medium text-neutral-700">{order.customer_name}</span>
        </div>

        <div className="text-right">
          <div className="device-text-caption font-semibold text-neutral-900">{order.total_amount}</div>
        </div>
      </div>

      {/* Row 3: Chat Button and Dates */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        <div className="flex-1 min-w-0">
          <span className="hidden lg:inline">
            Ordered: {createdDateDesktop} • {lastActionLabel}:{' '}
            {lastActionDateDesktop}
          </span>
          <span className="hidden sm:inline lg:hidden">
            Ordered: {createdDateTablet} • {lastActionLabel}:{' '}
            {lastActionDateTablet}
          </span>
          <span className="sm:hidden">
            Ordered: {createdDateMobile} • {lastActionLabel}:{' '}
            {lastActionDateMobile}
          </span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          threeD
          aria-label={`Ask about ${displayId}`}
          onClick={() => onViewInChat(order.order_id)}
          className="shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default OrderItem;
