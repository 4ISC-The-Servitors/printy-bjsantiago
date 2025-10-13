import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Text, Button, Badge } from '../../../shared';
import type { RecentOrder as RecentOrderType } from '../../../../types/customer';
import StatusBadge from './StatusBadge';
import PayNowButton from './PayNowButton';
import { formatLongDate } from '../../../../utils/shared/dateFormatter';
import { formatRelativeTimeLabel } from '../../../../utils/shared/timeFormatter';

interface RecentOrderProps {
  recentOrder: RecentOrderType;
}

const RecentOrder: React.FC<RecentOrderProps> = ({ recentOrder }) => {
  const navigate = useNavigate();
  const s = recentOrder.status.toLowerCase();
  
  // Database format (primary)
  const isAwaitingPayment = s === 'awaiting_payment';
  const isReuploadPayment = s === 'reupload_payment_proof';
  const isVerifyingPayment = s === 'verifying_payment';
  const isProcessing = s === 'processing';
  
  // Legacy format support
  const isLegacyAwaitingPayment = s === 'awaiting payment';
  const isLegacyVerifyingPayment = s === 'verifying payment';
  
  const shouldShowPayNow = isAwaitingPayment || isReuploadPayment || isLegacyAwaitingPayment;
  const shouldShowVerifyingMessage = isVerifyingPayment || isLegacyVerifyingPayment;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Text variant="h3" size="lg" weight="semibold">
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
        {/* Primary row: Display ID + Status */}
        <div className="flex items-center justify-between">
          <Text variant="h4" size="base" weight="medium" className="font-mono">
            {recentOrder.displayId}
          </Text>
          <StatusBadge status={recentOrder.status} />
        </div>
        
        {/* Secondary row: Title */}
        <Text variant="p" size="sm" color="muted" className="line-clamp-2">
          {recentOrder.title}
        </Text>
        
        {/* Tertiary row: Important dates */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <Text variant="p" size="xs" color="muted">Created:</Text>
            <Text variant="p" size="xs" color="muted">{formatLongDate(recentOrder.createdAt)}</Text>
          </div>
          <div className="flex justify-between">
            <Text variant="p" size="xs" color="muted">Updated:</Text>
            <Text variant="p" size="xs" color="muted">{formatRelativeTimeLabel(recentOrder.updatedAt)}</Text>
          </div>
          {recentOrder.paymentVerifiedAt && (
            <div className="flex justify-between">
              <Text variant="p" size="xs" color="muted">Payment Verified:</Text>
              <Text variant="p" size="xs" color="muted">{formatLongDate(recentOrder.paymentVerifiedAt)}</Text>
            </div>
          )}
          {recentOrder.completedAt && (
            <div className="flex justify-between">
              <Text variant="p" size="xs" color="muted">Completed:</Text>
              <Text variant="p" size="xs" color="muted">{formatLongDate(recentOrder.completedAt)}</Text>
            </div>
          )}
        </div>
        
        {/* Price if available */}
        {recentOrder.total && (
          <Text variant="p" size="lg" weight="medium" className="text-brand-primary">
            {recentOrder.total}
          </Text>
        )}
        
        {/* Action buttons and status messages */}
        <div className="pt-2">
          {shouldShowPayNow && (
            <PayNowButton orderId={recentOrder.id} total={recentOrder.total} />
          )}
          {shouldShowVerifyingMessage && (
            <div className="text-right">
              <Badge variant="info" size="sm">
                Awaiting Verification
              </Badge>
            </div>
          )}
          {isProcessing && (
            <div className="text-right">
              <Badge variant="success" size="sm">
                Payment Confirmed - In Production
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default RecentOrder;


