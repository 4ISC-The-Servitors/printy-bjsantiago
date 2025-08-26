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
          <Text variant="h4" size="xs" weight="semibold" className="mb-2">Recent Order</Text>
          <div className="space-y-1">
            <Text variant="p" size="xs" className="font-semibold line-clamp-1">{recentOrder.title}</Text>
            <Text variant="p" size="xs" color="muted">#{recentOrder.id}</Text>
            <div className="flex items-center justify-between">
              <Badge variant="info" size="sm">{recentOrder.status}</Badge>
              <Text variant="p" size="xs" color="muted">{new Date(recentOrder.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </div>
          </div>
        </Card>

        {/* Recent Ticket */}
        <Card className="p-3">
          <Text variant="h4" size="xs" weight="semibold" className="mb-2">Recent Ticket</Text>
          <div className="space-y-1">
            <Text variant="p" size="xs" className="font-medium line-clamp-1">{recentTicket.subject}</Text>
            <Text variant="p" size="xs" color="muted">#{recentTicket.id}</Text>
            <Badge variant="warning" size="sm">{recentTicket.status}</Badge>
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
              <Text variant="p" size="sm" className="font-semibold">{recentOrder.title}</Text>
              <Text variant="p" size="sm" color="muted">Order #{recentOrder.id}</Text>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="info" size="sm">{recentOrder.status}</Badge>
                <Text variant="p" size="xs" color="muted">{new Date(recentOrder.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </div>
            </div>
          </Card>

          {/* Recent Ticket */}
          <Card className="p-6">
            <Text variant="h3" size="lg" weight="semibold" className="mb-4">
              Recent Ticket
            </Text>
            <div className="space-y-2">
              <Text variant="p" size="sm" className="font-semibold">{recentTicket.subject}</Text>
              <Text variant="p" size="sm" color="muted">Ticket #{recentTicket.id}</Text>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="warning" size="sm">{recentTicket.status}</Badge>
                <Text variant="p" size="xs" color="muted">{new Date(recentTicket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default RecentActivity;
