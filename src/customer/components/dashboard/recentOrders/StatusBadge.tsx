import React from 'react';
import { Badge } from '@shared/components';
import { formatOrderStatus } from '@shared/utils';
import { useResponsiveBadge } from '@shared/hooks/ui';
import { getOrderStatusBadgeVariant } from '@shared/utils/statusColors';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { getStatusBadgeClasses } = useResponsiveBadge();

  return (
    <Badge
      variant={getOrderStatusBadgeVariant(status)}
      size="md"
      className={getStatusBadgeClasses('standard')}
    >
      {formatOrderStatus(status)}
    </Badge>
  );
};

export default StatusBadge;
