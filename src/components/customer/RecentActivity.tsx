import React from 'react';
import { Text, Badge, Card } from '../shared';

interface RecentOrder {
  id: string;
  title: string;
  status: string;
  updatedAt: number;
}

interface RecentTicket {
  id: string;
  subject: string;
  status: string;
  updatedAt: number;
}

interface RecentActivityProps {
  recentOrder: RecentOrder;
  recentTicket: RecentTicket;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  recentOrder,
  recentTicket
}) => {
  return (
    <>
      {/* Mobile-First Bento Grid */}
      <div className="space-y-3 mb-4 lg:hidden">
        {/* Recent Order */}
        <Card className="p-3">
          <Text variant="h4" size="sm" weight="semibold" className="mb-2">Recent Order</Text>
          <div className="space-y-3">
            <Text variant="p" size="sm" className="font-semibold line-clamp-1">{recentOrder.title}</Text>
            <Text variant="p" size="sm" color="muted">#{recentOrder.id}</Text>
            <Badge variant="info" size="md" className="text-md font-semibold">{recentOrder.status}</Badge>
          </div>
        </Card>

        {/* Recent Ticket */}
        <Card className="p-3">
          <Text variant="h4" size="sm" weight="semibold" className="mb-2">Recent Ticket</Text>
          <div className="space-y-3">
            <Text variant="p" size="sm" className="font-medium line-clamp-1">{recentTicket.subject}</Text>
            <Text variant="p" size="sm" color="muted">#{recentTicket.id}</Text>
            <Badge variant="warning" size="md" className="text-md font-semibold">{recentTicket.status}</Badge>
          </div>
        </Card>
      </div>

      {/* Desktop Layout - Preserved */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Recent Order */}
          <Card className="p-6">
            <Text variant="h3" size="lg" weight="semibold" className="mb-4">
              Recent Order
            </Text>
            <div className="space-y-2">
              <Text variant="p" size="base" className="font-semibold">{recentOrder.title}</Text>
              <Text variant="p" size="base" color="muted">Order #{recentOrder.id}</Text>
              <Badge variant="info" size="md" className="text-sm font-semibold">{recentOrder.status}</Badge>
            </div>
          </Card>

          {/* Recent Ticket */}
          <Card className="p-6">
            <Text variant="h3" size="lg" weight="semibold" className="mb-4">
              Recent Ticket
            </Text>
            <div className="space-y-2">
              <Text variant="p" size="base" className="font-semibold">{recentTicket.subject}</Text>
              <Text variant="p" size="base" color="muted">Ticket #{recentTicket.id}</Text>
              <Badge variant="warning" size="md" className="text-sm font-semibold">{recentTicket.status}</Badge>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default RecentActivity;
