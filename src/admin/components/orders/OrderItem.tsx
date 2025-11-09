import React, { useState } from 'react';
import { Badge, Button } from '@admin/components/shared';
import { CustomerInfoModal } from '@shared/components';
import { getOrderStatusBadgeVariant } from '@shared/utils/statusColors';
import { formatOrderStatus } from '@shared/utils';
import { formatDateWithTimeDesktop } from '@shared/utils/dateFormatter';
import { formatRelativeTimeLabel } from '@shared/utils/timeFormatter';
import { MessageSquare, User } from 'lucide-react';
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
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

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
            <span
              className={`${textClasses.caption} font-semibold text-neutral-900 whitespace-nowrap`}
            >
              {displayId}
            </span>
            <span className="text-neutral-400">•</span>
            <span
              className={`${textClasses.caption} font-medium text-neutral-700 truncate`}
            >
              {order.product_name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
          {showUrgentBadge && (
            <Badge
              variant="error"
              className={`${badgeClasses.text} ${badgeClasses.padding}`}
            >
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
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {/* Desktop/Tablet: User icon button */}
          <Button
            variant="ghost"
            size="sm"
            aria-label="View customer information"
            onClick={() => setIsCustomerModalOpen(true)}
            className="hidden sm:inline-flex shrink-0"
          >
            <User className="w-4 h-4" />
          </Button>
          <span
            className={`${textClasses.caption} font-medium text-neutral-700`}
          >
            {order.customer_name}
          </span>
        </div>

        <div className="text-right">
          <div
            className={`${textClasses.caption} font-semibold text-neutral-900`}
          >
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

        {/* Desktop/Tablet: Chat button */}
        <div className="hidden sm:flex shrink-0">
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

      {/* Mobile: Text buttons below dates */}
      <div className="mt-3 sm:hidden space-y-2">
        <Button
          variant="secondary"
          size="sm"
          threeD
          onClick={() => onViewInChat(order.order_id)}
          className="w-full"
        >
          Chat with Printy
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCustomerModalOpen(true)}
          className="w-full"
        >
          See Customer Info
        </Button>
      </div>

      <CustomerInfoModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customerId={order.customer_id}
        customerName={order.customer_name}
      />
    </div>
  );
};

export default OrderItem;
