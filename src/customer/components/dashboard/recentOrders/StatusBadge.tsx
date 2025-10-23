import React from 'react';
import { Badge } from '@shared/components';
import { formatOrderStatus } from '@shared/utils';
import { useResponsiveBadge } from '@shared/hooks/ui';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { getStatusBadgeClasses } = useResponsiveBadge();

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
    
    // Database format (primary)
    if (v === 'awaiting_payment') return 'warning';
    if (v === 'verifying_payment') return 'info';
    if (v === 'reupload_payment') return 'warning';
    if (v === 'processing') return 'primary';
    if (v === 'for_delivery') return 'accent';
    if (v === 'for_pickup') return 'accent';
    if (v === 'completed') return 'success';
    if (v === 'cancelled') return 'error';
    
    // Legacy format support
    if (v === 'needs quote' || v === 'needs_quote') return 'error';
    if (v === 'awaiting quote approval' || v === 'awaiting_quote_approval') return 'secondary';
    if (v === 'in_production') return 'primary';
    if (v === 'awaiting payment') return 'warning';
    if (v === 'verifying payment' || v === 'payment_verified') return 'info';
    if (v === 'for delivery/pick-up') return 'accent';
    
    return 'info';
  };
  return (
    <Badge variant={getVariant(status)} size="md" className={getStatusBadgeClasses('standard')}>
      {formatOrderStatus(status)}
    </Badge>
  );
};

export default StatusBadge;


