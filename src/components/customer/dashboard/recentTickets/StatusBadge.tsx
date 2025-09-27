import React from 'react';
import { Badge } from '../../../shared';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <Badge variant="warning" size="md" className="text-sm font-semibold">
    {status}
  </Badge>
);

export default StatusBadge;


