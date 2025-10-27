import React from 'react';
import { Badge, Button } from '@admin/components/shared';
import { getOrderStatusBadgeVariant } from '@shared/utils/statusColors';
import { formatOrderStatus } from '@shared/utils';
import { formatDateWithTimeDesktop } from '@shared/utils/dateFormatter';
import { formatRelativeTimeLabel } from '@shared/utils/timeFormatter';
import { MessageSquare } from 'lucide-react';
import type { AdminOrderRow } from '@admin/hooks/useAdminOrders';
import { useResponsiveClasses } from '@shared/hooks/ui';

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
  // Get responsive classes
  const { textClasses, badgeClasses } = useResponsiveClasses();

  // Show Urgent badge for valued customers
  const showUrgentBadge = order.customer_type === 'valued';

  // Get display ID with fallback to UUID
  const displayId = order.display_id || order.id;

  // Format dates with time
  const createdDate = formatDateWithTimeDesktop(order.created_at);

  // Use completed_at if status is 'completed', otherwise use updated_at
  const isCompleted = order.status === 'completed';
  const lastActionDateSource =
    isCompleted && order.completed_at ? order.completed_at : order.updated_at;
  const lastActionLabel = isCompleted ? 'Completed' : 'Updated';

  // For "Updated" dates, use relative time format; for "Completed" dates, use regular date format
  const useRelativeTime = !isCompleted && lastActionDateSource;

  const lastActionDate = useRelativeTime
    ? formatRelativeTimeLabel(lastActionDateSource)
    : formatDateWithTimeDesktop(lastActionDateSource);

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
            <span className={`${textClasses.caption} font-semibold text-neutral-900 whitespace-nowrap`}>
              {displayId}
            </span>
            <span className="text-neutral-400">•</span>
            <span className={`${textClasses.caption} font-medium text-neutral-700 truncate`}>
              {order.product_name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
          {showUrgentBadge && (
            <Badge variant="error" className={`${badgeClasses.text} ${badgeClasses.padding}`}>
              Urgent
            </Badge>
          )}
          <Badge
            variant={getOrderStatusBadgeVariant(order.status)}
            className={`${badgeClasses.text} ${badgeClasses.padding}`}
          >
            {formatOrderStatus(order.status)}
          </Badge>
        </div>
      </div>

      {/* Row 2: Customer Name | Amount */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <span className={`${textClasses.caption} font-medium text-neutral-700`}>
            {order.customer_name}
          </span>
        </div>

        <div className="text-right">
          <div className={`${textClasses.caption} font-semibold text-neutral-900`}>
            {order.total_amount}
          </div>
        </div>
      </div>

      {/* Row 3: Chat Button and Dates */}
      <div className="flex items-start justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        {/* Dates stacked vertically */}
        <div className="flex-1 min-w-0 mt-1">
          <div
            className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
          >
            <span className="font-medium">Ordered:</span>
            <span className="truncate">{createdDate}</span>
          </div>
          <div
            className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
          >
            <span className="font-medium">{lastActionLabel}:</span>
            <span className="truncate">{lastActionDate}</span>
          </div>
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
