import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Text, Button } from '@shared/components';
import { useResponsiveLayout, useResponsiveClasses } from '@shared/hooks/ui';
import type { RecentOrder as RecentOrderType } from '@shared/types/customer';
import StatusBadge from './StatusBadge';
import PayNowButton from './PayNowButton';
import ReuploadPaymentButton from './ReuploadPaymentButton';
import { formatShortDate } from '@shared/utils/dateFormatter';
import {
  formatRelativeTimeLabel,
  formatShortTime,
} from '@shared/utils/timeFormatter';

interface RecentOrderProps {
  recentOrder: RecentOrderType | null;
}

const RecentOrder: React.FC<RecentOrderProps> = ({ recentOrder }) => {
  const navigate = useNavigate();

  // Handle null/undefined status
  if (!recentOrder || !recentOrder.status) {
    return (
      <Card className="device-spacing-component">
        <div className="flex items-center justify-between mb-4">
          <Text
            variant="h3"
            className="device-text-heading"
            size="lg"
            weight="semibold"
          >
            Recent Order
          </Text>
          <Button
            variant="ghost"
            className="device-btn-secondary text-brand-primary hover:text-brand-primary-600"
            onClick={() => navigate('/customer/orders')}
          >
            View all
          </Button>
        </div>
        <div className="text-center py-8 text-neutral-500">
          <Text variant="p">No recent orders found</Text>
        </div>
      </Card>
    );
  }

  const s = recentOrder.status.toLowerCase();

  // Database format (primary)
  const isAwaitingPayment = s === 'awaiting_payment';
  const isReuploadPayment = s === 'reupload_payment';
  const { getOrderCardLayout } = useResponsiveLayout();
  const { textClasses } = useResponsiveClasses();
  const layout = getOrderCardLayout;

  return (
    <Card className="device-spacing-component">
      <div className="flex items-center justify-between mb-4">
        <Text
          variant="h3"
          className="device-text-heading"
          size="lg"
          weight="semibold"
        >
          Recent Order
        </Text>
        <Button
          variant="ghost"
          className="device-btn-secondary text-brand-primary hover:text-brand-primary-600"
          onClick={() => navigate('/customer/orders')}
        >
          View all
        </Button>
      </div>

      <div className="space-y-3">
        {/* Row 1: Display ID • Title | Status */}
        <div className={layout.structure.row1}>
          <div className={layout.leftSection}>
            <div className={`flex items-center ${layout.elementGap} min-w-0`}>
              <span className={`${layout.orderId} device-text-fraunces`}>
                {recentOrder.displayId}
              </span>
              {recentOrder.title ? (
                <>
                  <span className="text-neutral-400">•</span>
                  <span className={layout.productName}>
                    {recentOrder.title}
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <div className={layout.badgeContainer}>
            <StatusBadge status={recentOrder.status} />
          </div>
        </div>

        {/* Row 2: Amount only */}
        {recentOrder.total && (
          <div className={layout.structure.row2}>
            <div className={layout.leftSection} />
            <div className={layout.rightSection}>
              <div className={layout.amount}>{recentOrder.total}</div>
            </div>
          </div>
        )}

        {/* Row 3: Dates and actions; stack on mobile, row on sm+ */}
        <div className="mt-1 flex flex-col sm:flex-row items-start justify-between gap-3">
          <div>
            <div
              className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
            >
              <span className="font-medium">Created:</span>
              <span className="truncate">
                {formatShortDate(recentOrder.createdAt)} •{' '}
                {formatShortTime(recentOrder.createdAt)}
              </span>
            </div>
            {recentOrder.paymentVerifiedAt && (
              <div
                className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
              >
                <span className="font-medium">Payment Verified:</span>
                <span className="truncate">
                  {formatShortDate(recentOrder.paymentVerifiedAt)} •{' '}
                  {formatShortTime(recentOrder.paymentVerifiedAt)}
                </span>
              </div>
            )}
            {recentOrder.completedAt && (
              <div
                className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
              >
                <span className="font-medium">Completed:</span>
                <span className="truncate">
                  {formatShortDate(recentOrder.completedAt)} •{' '}
                  {formatShortTime(recentOrder.completedAt)}
                </span>
              </div>
            )}
            <div
              className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
            >
              <span className="font-medium">Updated:</span>
              <span className="truncate">
                {formatRelativeTimeLabel(recentOrder.updatedAt)}
              </span>
            </div>
          </div>

          <div className="shrink-0 mt-3 sm:mt-0">
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
      </div>
    </Card>
  );
};

export default RecentOrder;
