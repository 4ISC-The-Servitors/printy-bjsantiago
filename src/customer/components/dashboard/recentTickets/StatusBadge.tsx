import React from 'react';
import { Badge } from '@shared/components';
import { formatTicketStatus } from '@utils/shared';

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
    if (v === 'open') return 'error';
    if (v === 'in_progress') return 'warning';
    if (v === 'pending') return 'info';
    if (v === 'resolved') return 'success';
    if (v === 'closed') return 'secondary';
    return 'info';
  };

  return (
    <Badge variant={getVariant(status)} size="md" className="text-sm font-semibold">
      {formatTicketStatus(status)}
    </Badge>
  );
};

export default StatusBadge;


