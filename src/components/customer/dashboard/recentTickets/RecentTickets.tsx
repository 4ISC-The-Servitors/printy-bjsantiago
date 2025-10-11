import React from 'react';
import { Card, Text } from '../../../shared';
import type { RecentTicket as RecentTicketType } from '../../../../types/customer';
import TicketSubject from './TicketSubject';
import TicketID from './TicketID';
import StatusBadge from './StatusBadge';
import TrackTicketButton from './TrackTicketButton';

interface RecentTicketsProps {
  recentTicket: RecentTicketType;
}

const RecentTickets: React.FC<RecentTicketsProps> = ({ recentTicket }) => {
  return (
    <Card className="p-6">
      <Text variant="h3" size="lg" weight="semibold" className="mb-4">
        Recent Ticket
      </Text>
      <div className="space-y-2">
        <TicketSubject subject={recentTicket.subject} />
        <TicketID id={recentTicket.id} />
        <StatusBadge status={recentTicket.status} />
      </div>
      <div className="mt-4">
        <TrackTicketButton 
          inquiryId={recentTicket.id} 
          subject={recentTicket.subject} 
        />
      </div>
    </Card>
  );
};

export default RecentTickets;


