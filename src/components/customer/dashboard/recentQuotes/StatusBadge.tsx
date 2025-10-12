import React from 'react';
import { Badge } from '../../../shared';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'spec_proposed':
        return 'Quote Sent';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'ended':
        return 'Ended';
      default:
        return status;
    }
  };

  return (
    <div>
      <Badge variant={getVariant(status)} size="sm">
        {getStatusText(status)}
      </Badge>
    </div>
  );
};

export default StatusBadge;
