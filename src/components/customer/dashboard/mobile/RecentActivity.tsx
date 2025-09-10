import React from 'react';
import { Text, Badge, Card } from '../../../shared';
import type { RecentActivityProps } from '../_shared/types';

export const RecentActivity: React.FC<RecentActivityProps> = ({
  recentOrder,
  recentTicket,
}) => {
  return (
    <div className="space-y-3">
      {/* Recent Order */}
      <Card className="p-3">
        <Text variant="h4" size="sm" weight="semibold" className="mb-2">
          Recent Order
        </Text>
        <div className="space-y-3">
          <Text variant="p" size="sm" className="font-semibold line-clamp-1">
            {recentOrder.title}
          </Text>
          <Text variant="p" size="sm" color="muted">
            #{recentOrder.id}
          </Text>
          <Badge variant="info" size="md" className="text-md font-semibold">
            {recentOrder.status}
          </Badge>
        </div>
      </Card>

      {/* Recent Ticket */}
      <Card className="p-3">
        <Text variant="h4" size="sm" weight="semibold" className="mb-2">
          Recent Ticket
        </Text>
        <div className="space-y-3">
          <Text variant="p" size="sm" className="font-medium line-clamp-1">
            {recentTicket.subject}
          </Text>
          <Text variant="p" size="sm" color="muted">
            #{recentTicket.id}
          </Text>
          <Badge variant="warning" size="md" className="text-md font-semibold">
            {recentTicket.status}
          </Badge>
        </div>
      </Card>
    </div>
  );
};

export default RecentActivity;
