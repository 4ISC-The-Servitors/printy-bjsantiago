import React from 'react';
import { Badge } from '@shared/components';
import { formatQuoteStatus } from '@shared/utils';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'info';
      case 'spec_proposed':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'ended':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div>
      <Badge variant={getVariant(status)} size="md" className="text-sm font-semibold">
        {formatQuoteStatus(status)}
      </Badge>
    </div>
  );
};

export default StatusBadge;
