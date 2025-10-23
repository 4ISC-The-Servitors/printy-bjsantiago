import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Text, Button } from '@shared/components';
import { useResponsiveLayout, useResponsiveClasses } from '@shared/hooks/ui';
import type { RecentOrder as RecentOrderType } from '@shared/types/customer';
import StatusBadge from './StatusBadge';
import PayNowButton from './PayNowButton';
import ReuploadPaymentButton from './ReuploadPaymentButton';
import { formatLongDate } from '@shared/utils/dateFormatter';
import { formatRelativeTimeLabel } from '@shared/utils/timeFormatter';

interface RecentOrderProps {
  recentOrder: RecentOrderType;
}

const RecentOrder: React.FC<RecentOrderProps> = ({ recentOrder }) => {
  const navigate = useNavigate();
  const s = recentOrder.status.toLowerCase();

  // Database format (primary)
  const isAwaitingPayment = s === 'awaiting_payment';
  const isReuploadPayment = s === 'reupload_payment';
  const { getOrderCardLayout } = useResponsiveLayout();
  const { textClasses } = useResponsiveClasses();
  const layout = getOrderCardLayout;

  return (
    <Card className="p-3 sm:p-4 md:p-5 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <Text variant="h3" size="base" weight="semibold" className="sm:text-lg md:text-xl lg:text-2xl">
          Recent Order
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/customer/orders')}
          className="text-brand-primary hover:text-brand-primary-600"
        >
          View all
        </Button>
      </div>

      <div className="space-y-3">
        {/* Row 1: Display ID • Title | Status */}
        <div className={layout.structure.row1}>
          <div className={layout.leftSection}>
            <div className={`flex items-center ${layout.elementGap} min-w-0`}>
              <span className={`${layout.orderId} font-mono`}>
                {recentOrder.displayId}
              </span>
              {recentOrder.title ? (
                <>
                  <span className="text-neutral-400">•</span>
                  <span className={layout.productName}>{recentOrder.title}</span>
                </>
              ) : null}
            </div>
          </div>
          <div className={layout.badgeContainer}>
            <StatusBadge status={recentOrder.status} />
          </div>
        </div>

        {/* Row 2: Amount + Action */}
        <div className={layout.structure.row2}>
          <div className={layout.leftSection} />
          <div className={layout.rightSection}>
            {recentOrder.total && (
              <div className={layout.amount}>{recentOrder.total}</div>
            )}
            {isAwaitingPayment && (
              <PayNowButton
                orderId={recentOrder.id}
                displayId={recentOrder.displayId}
                total={recentOrder.total}
              />
            )}
            {isReuploadPayment && (
              <ReuploadPaymentButton
                orderId={recentOrder.id}
                displayId={recentOrder.displayId}
                total={recentOrder.total}
              />
            )}
          </div>
        </div>

        {/* Row 3: Dates (stacked) */}
        <div className="mt-1">
          <div className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}>
            <span className="font-medium">Created:</span>
            <span className="truncate">{formatLongDate(recentOrder.createdAt)}</span>
          </div>
          <div className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}>
            <span className="font-medium">Updated:</span>
            <span className="truncate">{formatRelativeTimeLabel(recentOrder.updatedAt)}</span>
          </div>
          {recentOrder.paymentVerifiedAt && (
            <div className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}>
              <span className="font-medium">Payment Verified:</span>
              <span className="truncate">{formatLongDate(recentOrder.paymentVerifiedAt)}</span>
            </div>
          )}
          {recentOrder.completedAt && (
            <div className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}>
              <span className="font-medium">Completed:</span>
              <span className="truncate">{formatLongDate(recentOrder.completedAt)}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default RecentOrder;
