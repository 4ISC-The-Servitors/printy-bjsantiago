import React from 'react';
import { Card, Text } from '../../../shared';
import type { RecentOrder as RecentOrderType } from '../../../../types/customer';
import OrderID from './OrderID';
import StatusBadge from './StatusBadge';
import Price from './Price';
import DateUpdated from './DateUpdated';
import PayNowButton from './PayNowButton';

interface RecentOrderProps {
  recentOrder: RecentOrderType;
}

const RecentOrder: React.FC<RecentOrderProps> = ({ recentOrder }) => {
  const s = recentOrder.status.toLowerCase();
  const isAwaitingPayment = s === 'awaiting payment' || s === 'awaiting_payment';

  return (
    <Card className="p-6 md:p-7">
      <div className="grid grid-cols-2 gap-6 items-start">
        <div className="space-y-5">
          <Text variant="h3" size="lg" weight="semibold" className="mb-1">
            Recent Order
          </Text>
          <OrderID id={recentOrder.id} displayId={recentOrder.displayId} />
          <StatusBadge status={recentOrder.status} />
        </div>
        <div className="text-right space-y-2 flex flex-col items-end justify-start pt-7">
          <div>
            {s === 'needs quote' ? (
              <Text variant="p" size="xl" weight="semibold">
                Awaiting Quote
              </Text>
            ) : ['awaiting quote approval', 'awaiting payment', 'awaiting_payment', 'verifying payment'].includes(s) ? (
              <Price total={recentOrder.total} />
            ) : null}
          </div>
          <div>
            <DateUpdated ts={recentOrder.updatedAt} />
          </div>
        </div>
      </div>

      {isAwaitingPayment && (
        <div className="flex justify-end mt-4">
          <PayNowButton orderId={recentOrder.id} total={recentOrder.total} />
        </div>
      )}
    </Card>
  );
};

export default RecentOrder;


