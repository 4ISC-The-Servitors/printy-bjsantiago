import React from 'react';
import { Badge, Button, Checkbox } from '../../shared';
import { getOrderStatusBadgeVariant } from '../../../utils/admin/statusColors';
import { formatOrderStatus } from '../../../utils/shared/statusFormatter';
import { MessageSquare } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useIsMobile } from '../../../hooks/ui/useIsMobile';
import { MobileCardMenu } from '../mobile';
import type { AdminOrderRow } from '../../../hooks/admin/useAdminOrders';

// Use AdminOrderRow type instead of local Order interface
type Order = AdminOrderRow;

interface OrderItemProps {
  order: Order;
  isSelected: boolean;
  isHovered: boolean;
  showCheckbox: boolean;
  openMenuId: string | null;
  onHover: (orderId: string | null) => void;
  onToggleSelection: (orderId: string) => void;
  onViewInChat: (orderId: string) => void;
  onToggleMenu: (orderId: string | null) => void;
}

export const OrderItem: React.FC<OrderItemProps> = ({
  order,
  isSelected,
  isHovered,
  showCheckbox,
  openMenuId,
  onHover,
  onToggleSelection,
  onViewInChat,
  onToggleMenu,
}) => {
  const isMobile = useIsMobile();

  return (
    <div
      className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 rounded-lg border bg-white/60 hover:bg-white transition-colors relative"
      onMouseEnter={() => onHover(order.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Hover checkbox on left */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(order.id)}
          className={cn(
            'transition-opacity bg-white border-2 border-gray-300 w-5 h-5 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
            isHovered || showCheckbox ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>

      <div className="flex w-full items-center justify-between gap-3 sm:gap-4 pl-6">
        {/* Left section: identifiers, customer, badges */}
        <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-xs sm:text-sm lg:text-base font-medium text-neutral-500 truncate">
              {order.id}
            </span>
            <div className="text-sm sm:text-base lg:text-lg font-medium text-neutral-900 sm:hidden truncate">
              {order.customer}
            </div>
          </div>

          {/* Mobile badges */}
          <div className="flex items-center justify-between sm:hidden">
            <div className="flex items-center gap-2">
              {order.priority && (
                <Badge size="sm" variant="error" className="text-xs">
                  {order.priority}
                </Badge>
              )}
              <Badge
                size="sm"
                variant={getOrderStatusBadgeVariant(order.status)}
                className="text-xs"
              >
                {formatOrderStatus(order.status)}
              </Badge>
            </div>
          </div>

          {/* Desktop: customer + badges */}
          <div className="hidden sm:block text-sm sm:text-base lg:text-lg font-medium text-neutral-900 truncate">
            {order.customer}
          </div>
          <div className="hidden sm:flex sm:items-center sm:gap-3">
            {order.priority && (
              <Badge
                size="sm"
                variant="error"
                className="text-xs sm:text-sm"
              >
                {order.priority}
              </Badge>
            )}
            <Badge
              size="sm"
              variant={getOrderStatusBadgeVariant(order.status)}
              className="text-xs sm:text-sm"
            >
              {formatOrderStatus(order.status)}
            </Badge>
          </div>
        </div>

        {/* Right section: amount/date + action */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <div className="text-sm sm:text-base lg:text-lg xl:text-xl font-semibold">
              {order.total}
            </div>
            <div className="text-xs sm:text-sm text-neutral-500">
              {order.date}
            </div>
          </div>

          {/* Desktop: Button, Mobile: Menu */}
          {isMobile ? (
            <MobileCardMenu
              isOpen={openMenuId === order.id}
              onToggle={() =>
                onToggleMenu(openMenuId === order.id ? null : order.id)
              }
              actions={[
                {
                  label: 'View in Chat',
                  onClick: () => onViewInChat(order.id),
                },
                {
                  label: isSelected ? 'Unselect' : 'Select',
                  onClick: () => onToggleSelection(order.id),
                },
              ]}
            />
          ) : (
            <Button
              variant="secondary"
              size="sm"
              threeD
              aria-label={`Ask about ${order.id}`}
              onClick={() => onViewInChat(order.id)}
              className="shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
