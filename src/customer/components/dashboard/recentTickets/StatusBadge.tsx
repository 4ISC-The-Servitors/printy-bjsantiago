import React from 'react';
import { Badge } from '@shared/components';
import { formatTicketStatus } from '@shared/utils';
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
    if (v === 'open') return 'error';
    if (v === 'in_progress') return 'warning';
    if (v === 'pending') return 'info';
    if (v === 'resolved') return 'success';
    if (v === 'closed') return 'secondary';
    return 'info';
  };

  return (
    <Badge variant={getVariant(status)} size="md" className={getStatusBadgeClasses('standard')}>
      {formatTicketStatus(status)}
    </Badge>
  );
};

export default StatusBadge;


