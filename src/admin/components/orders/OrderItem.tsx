import React from 'react';
import { Badge, Button } from '@admin/components/shared';
import { getOrderStatusBadgeVariant } from '@shared/utils/statusColors';
import { formatOrderStatus } from '@shared/utils';
import {
  formatOrderDateDesktop,
  formatOrderDateTablet,
  formatOrderDateMobile
} from '@shared/utils';
import { formatRelativeTimeLabel } from '@shared/utils';
import { MessageSquare } from 'lucide-react';
import type { AdminOrderRow } from '@admin/hooks/useAdminOrders';
import { useResponsiveLayout } from '@shared/hooks';

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
  // Get responsive layout classes
  const { getOrderCardLayout } = useResponsiveLayout();
  const layout = getOrderCardLayout;
  
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
  const lastActionDate = isCompleted && order.completed_at ? order.completed_at : order.updated_at;
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
      className={`group ${layout.container}`}
      onMouseEnter={() => onHover(order.order_id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Row 1: Order ID + Product Name | Status Badges */}
      <div className={layout.structure.row1}>
        <div className={layout.leftSection}>
          <div className={`flex items-center ${layout.elementGap} min-w-0`}>
            <span className={layout.orderId}>{displayId}</span>
            <span className="text-neutral-400">•</span>
            <span className={layout.productName}>{order.product_name}</span>
          </div>
        </div>
        
        <div className={layout.badgeContainer}>
          {showUrgentBadge && (
            <Badge 
              variant="error" 
              className={layout.urgentBadge}
            >
              Urgent
            </Badge>
          )}
          <Badge
            variant={getOrderStatusBadgeVariant(order.status)}
            className={layout.statusBadge}
          >
            {formatOrderStatus(order.status)}
          </Badge>
        </div>
      </div>

      {/* Row 2: Customer Name | Amount */}
      <div className={layout.structure.row2}>
        <div className={layout.leftSection}>
          <span className={layout.customerName}>{order.customer_name}</span>
        </div>
        
        <div className="text-right">
          <div className={layout.amount}>{order.total_amount}</div>
        </div>
      </div>

      {/* Row 3: Chat Button and Dates */}
      <div className={layout.structure.row3}>
        <div className={layout.dates}>
          <span className="hidden lg:inline">
            Ordered: {createdDateDesktop} • {lastActionLabel}: {lastActionDateDesktop}
          </span>
          <span className="hidden sm:inline lg:hidden">
            Ordered: {createdDateTablet} • {lastActionLabel}: {lastActionDateTablet}
          </span>
          <span className="sm:hidden">
            Ordered: {createdDateMobile} • {lastActionLabel}: {lastActionDateMobile}
          </span>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          threeD
          aria-label={`Ask about ${displayId}`}
          onClick={() => onViewInChat(order.order_id)}
          className={layout.chatButton}
        >
          <MessageSquare className={layout.chatIcon} />
        </Button>
      </div>
    </div>
  );
};

export default OrderItem;
