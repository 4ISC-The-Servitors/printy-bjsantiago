import React from 'react';
import { Badge, Button } from '../../shared';
import { getOrderStatusBadgeVariant } from '../../../utils/admin/statusColors';
import { formatOrderStatus } from '../../../utils/shared/statusFormatter';
import { 
  formatOrderDateDesktop, 
  formatOrderDateTablet, 
  formatOrderDateMobile 
} from '../../../utils/shared/dateFormatter';
import { MessageSquare } from 'lucide-react';
import type { AdminOrderRow } from '../../../hooks/admin/useAdminOrders';

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
  
  const lastActionDateDesktop = formatOrderDateDesktop(lastActionDate);
  const lastActionDateTablet = formatOrderDateTablet(lastActionDate);
  const lastActionDateMobile = formatOrderDateMobile(lastActionDate);

  return (
    <div
      className="group p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg border bg-white/60 hover:bg-white transition-colors"
      onMouseEnter={() => onHover(order.id)}
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
            <Badge 
              variant="error" 
              className="text-xs sm:text-sm md:text-base lg:text-lg px-1.5 py-0.5 sm:px-2 sm:py-0.5 md:px-2.5 md:py-1 lg:px-3 lg:py-1"
            >
              Urgent
            </Badge>
          )}
          <Badge
            variant={getOrderStatusBadgeVariant(order.status)}
            className="text-xs sm:text-sm md:text-base lg:text-lg px-1.5 py-0.5 sm:px-2 sm:py-0.5 md:px-2.5 md:py-1 lg:px-3 lg:py-1"
          >
            {formatOrderStatus(order.status)}
          </Badge>
        </div>
      </div>

      {/* Row 2: Customer Name | Amount */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <span className="device-text-body font-medium text-neutral-900 truncate">
            {order.customer_name}
          </span>
        </div>
        
        <div className="text-right">
          <div className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-neutral-900">
            {order.total_amount}
          </div>
        </div>
      </div>

      {/* Row 3: Chat Button and Dates */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        <div className="device-text-caption text-neutral-500">
          <span className="hidden lg:inline">
            Ordered: {createdDateDesktop} • {lastActionLabel}: {lastActionDateDesktop}
          </span>
          <span className="hidden sm:inline lg:hidden">
            {createdDateTablet} • {lastActionLabel}: {lastActionDateTablet}
          </span>
          <span className="sm:hidden">
            {createdDateMobile} • {lastActionLabel} {lastActionDateMobile}
          </span>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          threeD
          aria-label={`Ask about ${displayId}`}
          onClick={() => onViewInChat(order.id)}
          className="device-btn-secondary shrink-0"
        >
          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </Button>
      </div>
    </div>
  );
};

export default OrderItem;
