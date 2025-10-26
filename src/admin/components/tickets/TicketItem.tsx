import React from 'react';
import { Badge, Button } from '@admin/components/shared';
import { getTicketStatusBadgeVariant } from '@shared/utils/statusColors';
import { formatTicketStatus, formatInquiryType } from '@shared/utils/statusFormatter';
import {
  formatDateWithTimeDesktop,
  formatDateWithTimeTablet,
  formatDateWithTimeMobile,
} from '@shared/utils/dateFormatter';
import { formatRelativeTimeLabel } from '@shared/utils/timeFormatter';
import { MessageSquare } from 'lucide-react';
import { useResponsiveLayout } from '@shared/hooks/ui';

interface Ticket {
  inquiry_id: string;
  display_id?: string | null;
  inquiry_type: string | null;
  inquiry_status: string | null;
  customer_full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email_address?: string | null;
  customer_type?: string | null;
  received_at?: string | null;
  updated_at?: string | null;
  order_id?: string | null;
  session_id?: string | null;
  customer?: {
    first_name?: string | null;
    last_name?: string | null;
    customer_type?: string | null;
  } | null;
}

interface TicketItemProps {
  ticket: Ticket;
  onViewInChat: (ticketId: string) => void;
}

export const TicketItem: React.FC<TicketItemProps> = ({
  ticket,
  onViewInChat,
}) => {
  // Debug logging

  // Get responsive layout classes
  const { getTicketCardLayout } = useResponsiveLayout();
  const layout = getTicketCardLayout;

  // Show Urgent badge for valued customers
  const showUrgentBadge =
    ticket.customer_type === 'valued' ||
    ticket.customer?.customer_type === 'valued';

  // Get display ID with fallback to UUID
  const displayId = ticket.display_id || ticket.inquiry_id;

  // Format customer name - check multiple possible data structures
  const customerName =
    ticket.customer_full_name ||
    (ticket.first_name && ticket.last_name
      ? `${ticket.first_name} ${ticket.last_name}`
      : ticket.customer?.first_name && ticket.customer?.last_name
        ? `${ticket.customer.first_name} ${ticket.customer.last_name}`
        : 'Customer');

  // Format inquiry type for display
  const inquiryType = formatInquiryType(ticket.inquiry_type || 'other');

  // Format both received and updated dates responsively with time
  const receivedDateDesktop = ticket.received_at
    ? formatDateWithTimeDesktop(ticket.received_at)
    : '—';
  const receivedDateTablet = ticket.received_at
    ? formatDateWithTimeTablet(ticket.received_at)
    : '—';
  const receivedDateMobile = ticket.received_at
    ? formatDateWithTimeMobile(ticket.received_at)
    : '—';

  // Use relative time format for updated dates
  const updatedDateDesktop = ticket.updated_at
    ? formatRelativeTimeLabel(ticket.updated_at)
    : '—';
  const updatedDateTablet = ticket.updated_at
    ? formatRelativeTimeLabel(ticket.updated_at)
    : '—';
  const updatedDateMobile = ticket.updated_at
    ? formatRelativeTimeLabel(ticket.updated_at)
    : '—';

  return (
    <div className={`group ${layout.container}`}>
      {/* Row 1: Ticket ID + Type | Status Badges */}
      <div className={layout.structure.row1}>
        <div className={layout.leftSection}>
          <div className={`flex items-center ${layout.elementGap} min-w-0`}>
            <span className={layout.orderId}>{displayId}</span>
            <span className="text-neutral-400">•</span>
            <span className={layout.productName}>{inquiryType}</span>
          </div>
        </div>

        <div className={layout.badgeContainer}>
          {showUrgentBadge && (
            <Badge variant="error" className={layout.urgentBadge}>
              Urgent
            </Badge>
          )}
          <Badge
            variant={getTicketStatusBadgeVariant(ticket.inquiry_status || '')}
            className={layout.statusBadge}
          >
            {formatTicketStatus(ticket.inquiry_status || '')}
          </Badge>
        </div>
      </div>

      {/* Row 2: Customer Name | Chat Button */}
      <div className={layout.structure.row2}>
        <div className={layout.leftSection}>
          <span className={layout.customerName}>{customerName}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            threeD
            aria-label={`Ask about ${displayId}`}
            onClick={() => onViewInChat(ticket.inquiry_id)}
            className={layout.chatButton}
          >
            <MessageSquare className={layout.chatIcon} />
          </Button>
        </div>
      </div>

      {/* Row 3: Dates */}
      <div className={layout.structure.row3}>
        <div className={layout.dates}>
          <span className="hidden lg:inline">
            Received: {receivedDateDesktop}
            {ticket.updated_at && ticket.updated_at !== ticket.received_at && (
              <span className="ml-2">• Updated: {updatedDateDesktop}</span>
            )}
          </span>
          <span className="hidden sm:inline lg:hidden">
            Received: {receivedDateTablet}
            {ticket.updated_at && ticket.updated_at !== ticket.received_at && (
              <span className="ml-2">• Updated: {updatedDateTablet}</span>
            )}
          </span>
          <span className="sm:hidden">
            Received: {receivedDateMobile}
            {ticket.updated_at && ticket.updated_at !== ticket.received_at && (
              <span className="ml-1 text-xs">
                • Updated: {updatedDateMobile}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TicketItem;
