import React from 'react';
import { Badge } from '@shared/components';
import { formatQuoteStatus } from '@shared/utils';
import { useResponsiveBadge } from '@shared/hooks/ui';

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

  const { getStatusBadgeClasses } = useResponsiveBadge();
  return (
    <div>
      <Badge
        variant={getVariant(status)}
        size="md"
        className={getStatusBadgeClasses('standard')}
      >
        {formatQuoteStatus(status)}
      </Badge>
    </div>
  );
};

export default StatusBadge;
