import React from 'react';
import { Badge } from '../../../shared';

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
    if (v === 'needs quote') return 'error';
    if (v === 'awaiting quote approval') return 'secondary';
    if (v === 'processing') return 'primary';
    if (v === 'awaiting payment') return 'warning';
    if (v === 'verifying payment') return 'info';
    if (v === 'for delivery/pick-up') return 'accent';
    if (v === 'completed') return 'success';
    if (v === 'requesting cancellation') return 'error';
    if (v === 'cancelled') return 'error';
    return 'info';
  };
  return (
    <Badge variant={getVariant(status)} size="md" className="text-sm font-semibold">
      {status}
    </Badge>
  );
};

export default StatusBadge;


