import React from 'react';
import { Badge } from '../../../shared';
import { formatOrderStatus } from '../../../../utils/shared';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getVariant = (s: string):
    | 'default'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'success'
    | 'warning'
    | 'error'
    | 'info' => {
    const v = s.toLowerCase();
    if (v === 'needs quote' || v === 'needs_quote') return 'error';
    if (v === 'awaiting quote approval' || v === 'awaiting_quote_approval') return 'secondary';
    if (v === 'processing' || v === 'in_production') return 'primary';
    if (v === 'awaiting payment' || v === 'awaiting_payment') return 'warning';
    if (v === 'verifying payment' || v === 'payment_verified') return 'info';
    if (v === 'for delivery/pick-up' || v === 'for_delivery') return 'accent';
    if (v === 'completed') return 'success';
    if (v === 'requesting cancellation' || v === 'requesting_cancellation') return 'error';
    if (v === 'cancelled') return 'error';
    return 'info';
  };
  return (
    <Badge variant={getVariant(status)} size="md" className="text-sm font-semibold">
      {formatOrderStatus(status)}
    </Badge>
  );
};

export default StatusBadge;


