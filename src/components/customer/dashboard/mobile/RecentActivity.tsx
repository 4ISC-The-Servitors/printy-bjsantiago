import React from 'react';
import { Text, Badge, Card, Button } from '../../../shared';
import { formatLongDate } from '../../../../utils/shared';
import type { RecentActivityProps } from '../_shared/types';

export const RecentActivity: React.FC<RecentActivityProps> = ({
  recentOrder,
  recentTicket,
}) => {
  const getOrderStatusVariant = (
    status: string
  ):
    | 'default'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'success'
    | 'warning'
    | 'error'
    | 'info' => {
    const s = status.toLowerCase();
    if (s === 'needs quote') return 'error';
    if (s === 'pending') return 'secondary';
    if (s === 'processing') return 'primary';
    if (s === 'awaiting payment') return 'warning';
    if (s === 'verifying payment') return 'info';
    if (s === 'for delivery/pick-up') return 'accent';
    if (s === 'completed') return 'success';
    if (s === 'cancelled') return 'error';
    return 'info';
  };
  return (
    <div className="space-y-3">
      {/* Recent Order */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3 items-start">
          {/* Left column */}
          <div className="space-y-2">
            <Text variant="h4" size="sm" weight="semibold" className="mb-0.5">
              Recent Order
            </Text>
            <Text variant="p" size="sm" color="muted">
              #{recentOrder.id}
            </Text>
            <Badge
              variant={getOrderStatusVariant(recentOrder.status)}
              size="md"
              className="text-md font-semibold"
            >
              {recentOrder.status}
            </Badge>
          </div>

          {/* Right column */}
          <div className="text-right space-y-1 pt-5">
            {recentOrder.status.toLowerCase() === 'needs quote' ? (
              <Text variant="p" size="sm" weight="semibold">
                Awaiting Quote
              </Text>
            ) : ['pending', 'awaiting payment', 'verifying payment'].includes(
                recentOrder.status.toLowerCase()
              ) ? (
              <Text variant="p" size="sm" weight="semibold">
                ₱5,000
              </Text>
            ) : null}
            <Text variant="p" size="xs" color="muted">
              {formatLongDate(recentOrder.updatedAt)}
            </Text>
          </div>
        </div>
        {['awaiting payment', 'verifying payment'].includes(
          recentOrder.status.toLowerCase()
        ) && (
          <div className="flex justify-end mt-3">
            <Button
              variant="primary"
              size="sm"
              threeD
              onClick={() => {
                const event = new CustomEvent('customer-open-payment-chat', {
                  detail: { orderId: recentOrder.id },
                });
                window.dispatchEvent(event);
              }}
            >
              Pay Now
            </Button>
          </div>
        )}
      </Card>

      {/* Recent Ticket */}
      <Card className="p-3">
        <Text variant="h4" size="sm" weight="semibold" className="mb-2">
          Recent Ticket
        </Text>
        <div className="space-y-3">
          <Text variant="p" size="sm" className="font-medium line-clamp-1">
            {recentTicket.subject}
          </Text>
          <Text variant="p" size="sm" color="muted">
            #{recentTicket.id}
          </Text>
          <Badge variant="warning" size="md" className="text-md font-semibold">
            {recentTicket.status}
          </Badge>
        </div>
      </Card>
    </div>
  );
};

export default RecentActivity;
