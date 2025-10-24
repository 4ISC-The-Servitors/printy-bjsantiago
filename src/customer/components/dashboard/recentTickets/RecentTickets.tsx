import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Text, Button } from '@shared/components';
import type { RecentTicket as RecentTicketType } from '@shared/types/customer';
import StatusBadge from './StatusBadge';
import TrackTicketButton from './TrackTicketButton';
import { formatShortDate } from '@shared/utils/dateFormatter';
import { formatRelativeTimeLabel } from '@shared/utils/timeFormatter';
import { useResponsiveLayout, useResponsiveClasses } from '@shared/hooks/ui';

interface RecentTicketsProps {
  recentTicket: RecentTicketType | null;
}

const RecentTickets: React.FC<RecentTicketsProps> = ({ recentTicket }) => {
  const navigate = useNavigate();

  // Handle null/undefined ticket
  if (!recentTicket) {
    return (
      <Card className="device-spacing-component">
        <div className="flex items-center justify-between mb-4">
          <Text
            variant="h3"
            className="device-text-heading"
            size="lg"
            weight="semibold"
          >
            Recent Ticket
          </Text>
          <Button
            variant="ghost"
            className="device-btn-secondary text-brand-primary hover:text-brand-primary-600"
            onClick={() => navigate('/customer/tickets')}
          >
            View all
          </Button>
        </div>
        <div className="text-center py-8 text-neutral-500">
          <Text variant="p">No recent tickets found</Text>
        </div>
      </Card>
    );
  }

  const { getTicketCardLayout } = useResponsiveLayout();
  const { textClasses } = useResponsiveClasses();
  const layout = getTicketCardLayout;

  return (
    <Card className="device-spacing-component">
      <div className="flex items-center justify-between mb-4">
        <Text
          variant="h3"
          className="device-text-heading"
          size="lg"
          weight="semibold"
        >
          Recent Ticket
        </Text>
        <Button
          variant="ghost"
          className="device-btn-secondary text-brand-primary hover:text-brand-primary-600"
          onClick={() => navigate('/customer/tickets')}
        >
          View all
        </Button>
      </div>
      <div className="space-y-3">
        {/* Row 1: Ticket ID • Subject | Status */}
        <div className={layout.structure.row1}>
          <div className={layout.leftSection}>
            <div className={`flex items-center ${layout.elementGap} min-w-0`}>
              <span className={`${layout.orderId} device-text-fraunces`}>
                {recentTicket.displayId}
              </span>
              {recentTicket.subject ? (
                <>
                  <span className="text-neutral-400">•</span>
                  <span className={layout.productName}>
                    {recentTicket.subject}
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <div className={layout.badgeContainer}>
            <StatusBadge status={recentTicket.status} />
          </div>
        </div>

        {/* Row 2: Secondary info | Action */}
        <div className={layout.structure.row2}>
          <div className={layout.leftSection} />
          <div className={layout.rightSection}>
            <TrackTicketButton
              inquiryId={recentTicket.id}
              subject={recentTicket.subject}
              status={recentTicket.status}
            />
          </div>
        </div>

        {/* Row 3: Dates (stacked) */}
        <div className="mt-1">
          <div
            className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
          >
            <span className="font-medium">Created:</span>
            <span className="truncate">
              {formatShortDate(recentTicket.createdAt)}
            </span>
          </div>
          <div
            className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
          >
            <span className="font-medium">Updated:</span>
            <span className="truncate">
              {formatRelativeTimeLabel(recentTicket.updatedAt)}
            </span>
          </div>
          {recentTicket.resolvedAt && (
            <div
              className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
            >
              <span className="font-medium">Resolved:</span>
              <span className="truncate">
                {formatShortDate(recentTicket.resolvedAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default RecentTickets;
