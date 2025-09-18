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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
      {/* Recent Order */}
      <Card className="p-6 md:p-7">
        <div className="grid grid-cols-2 gap-6 items-start">
          {/* Left column */}
          <div className="space-y-5">
            <Text variant="h3" size="lg" weight="semibold" className="mb-1">
              Recent Order
            </Text>
            <Text variant="p" size="base" color="muted" className="leading-6">
              #{recentOrder.id}
            </Text>
            <Badge
              variant={getOrderStatusVariant(recentOrder.status)}
              size="md"
              className="text-sm font-semibold"
            >
              {recentOrder.status}
            </Badge>
          </div>

          {/* Right column */}
          <div className="text-right space-y-2 flex flex-col items-end justify-start pt-7">
            <div>
              {recentOrder.status.toLowerCase() === 'needs quote' ? (
                <Text variant="p" size="xl" weight="semibold">
                  Awaiting Quote
                </Text>
              ) : ['pending', 'awaiting payment', 'verifying payment'].includes(
                  recentOrder.status.toLowerCase()
                ) ? (
                <Text
                  variant="p"
                  size="2xl"
                  weight="semibold"
                  className="tracking-tight"
                >
                  ₱5,000
                </Text>
              ) : null}
            </div>
            <div>
              <Text variant="p" size="sm">
                {formatLongDate(recentOrder.updatedAt)}
              </Text>
            </div>
          </div>
        </div>
        {['awaiting payment', 'verifying payment'].includes(
          recentOrder.status.toLowerCase()
        ) && (
          <div className="flex justify-end mt-4">
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
      <Card className="p-6">
        <Text variant="h3" size="lg" weight="semibold" className="mb-4">
          Recent Ticket
        </Text>
        <div className="space-y-2">
          <Text variant="p" size="base" className="font-semibold">
            {recentTicket.subject}
          </Text>
          <Text variant="p" size="base" color="muted">
            Ticket #{recentTicket.id}
          </Text>
          <Badge variant="warning" size="md" className="text-sm font-semibold">
            {recentTicket.status}
          </Badge>
        </div>
      </Card>
    </div>
  );
};

export default RecentActivity;
