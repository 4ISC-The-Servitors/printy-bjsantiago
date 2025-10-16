import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Text, Button, Badge } from '@shared/components';
import type { RecentTicket as RecentTicketType } from '../../../types/customer';
import StatusBadge from './StatusBadge';
import TrackTicketButton from './TrackTicketButton';
import { formatLongDate } from '@utils/shared/dateFormatter';
import { formatRelativeTimeLabel } from '@utils/shared/timeFormatter';

interface RecentTicketsProps {
  recentTicket: RecentTicketType;
}

const RecentTickets: React.FC<RecentTicketsProps> = ({ recentTicket }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Text variant="h3" size="lg" weight="semibold">
          Recent Ticket
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/customer/tickets')}
          className="text-brand-primary hover:text-brand-primary-600"
        >
          View all
        </Button>
      </div>
      <div className="space-y-3">
        {/* Primary row: Display ID + Status */}
        <div className="flex items-center justify-between">
          <Text variant="h4" size="base" weight="medium" className="font-mono">
            {recentTicket.displayId}
          </Text>
          <StatusBadge status={recentTicket.status} />
        </div>
        
        {/* Secondary row: Subject */}
        <Text variant="p" size="sm" color="muted" className="line-clamp-2">
          {recentTicket.subject}
        </Text>
        
        {/* Tertiary row: Important dates */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <Text variant="p" size="xs" color="muted">Created:</Text>
            <Text variant="p" size="xs" color="muted">{formatLongDate(recentTicket.createdAt)}</Text>
          </div>
          <div className="flex justify-between">
            <Text variant="p" size="xs" color="muted">Updated:</Text>
            <Text variant="p" size="xs" color="muted">{formatRelativeTimeLabel(recentTicket.updatedAt)}</Text>
          </div>
          {recentTicket.resolvedAt && (
            <div className="flex justify-between">
              <Text variant="p" size="xs" color="muted">Resolved:</Text>
              <Text variant="p" size="xs" color="muted">{formatLongDate(recentTicket.resolvedAt)}</Text>
            </div>
          )}
        </div>
        
        {/* Priority if available */}
        
        {/* Action button */}
        <div className="pt-2">
          <TrackTicketButton 
            inquiryId={recentTicket.id} 
            subject={recentTicket.subject} 
          />
        </div>
      </div>
    </Card>
  );
};

export default RecentTickets;


