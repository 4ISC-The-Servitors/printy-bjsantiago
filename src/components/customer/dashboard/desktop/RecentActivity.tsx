import React from 'react';
import { Text, Badge, Card } from '../../../shared';
import type { RecentActivityProps } from '../_shared/types';

export const RecentActivity: React.FC<RecentActivityProps> = ({
  recentOrder,
  recentTicket,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
      {/* Recent Order */}
      <Card className="p-6">
        <Text variant="h3" size="lg" weight="semibold" className="mb-4">
          Recent Order
        </Text>
        <div className="space-y-2">
          <Text variant="p" size="base" className="font-semibold">
            {recentOrder.title}
          </Text>
          <Text variant="p" size="base" color="muted">
            Order #{recentOrder.id}
          </Text>
          <Badge variant="info" size="md" className="text-sm font-semibold">
            {recentOrder.status}
          </Badge>
        </div>
      </Card>

      {/* Recent Ticket */}
      <Card className="p-6">
        <Text variant="h3" size="lg" weight="semibold" className="mb-4">
          Recent Ticket
        </Text>
        <div className="space-y-2">
          <Text variant="p" size="base" className="font-semibold">
            {recentTicket.subject}
          </Text>
          <Text variant="p" size="base" color="muted">
            Ticket #{recentTicket.id}
          </Text>
          <Badge variant="warning" size="md" className="text-sm font-semibold">
            {recentTicket.status}
          </Badge>
        </div>
      </Card>
    </div>
  );
};

export default RecentActivity;
