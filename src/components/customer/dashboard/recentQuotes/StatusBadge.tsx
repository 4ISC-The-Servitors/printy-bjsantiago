import React from 'react';
import { Badge } from '../../../shared';
import { formatQuoteStatus } from '../../../../utils/shared';

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
      <Badge variant={getVariant(status)} size="sm">
        {formatQuoteStatus(status)}
      </Badge>
    </div>
  );
};

export default StatusBadge;
