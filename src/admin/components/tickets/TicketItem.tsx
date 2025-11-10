import React, { useEffect, useState } from 'react';
import { Badge, Button } from '@admin/components/shared';
import { CustomerInfoModal } from '@shared/components';
import { getTicketStatusBadgeVariant } from '@shared/utils/statusColors';
import {
  formatTicketStatus,
  formatInquiryType,
} from '@shared/utils/statusFormatter';
import { formatDateWithTimeDesktop } from '@shared/utils/dateFormatter';
import { formatRelativeTimeLabel } from '@shared/utils/timeFormatter';
import { MessageSquare, User } from 'lucide-react';
import { useResponsiveLayout, useResponsiveClasses } from '@shared/hooks/ui';
import type { AdminTicketRow } from '@features/chat/hooks/admin/useAdminTickets';

// Use AdminTicketRow type instead of local Ticket interface
type Ticket = AdminTicketRow;

interface TicketItemProps {
  ticket: Ticket;
  onViewInChat: (ticketId: string) => void;
  isUnread: boolean;
  onMarkViewed: (ticketId: string, version?: string | null) => void;
  currentUserId?: string | null;
}

export const TicketItem: React.FC<TicketItemProps> = ({
  ticket,
  onViewInChat,
  isUnread,
  onMarkViewed,
  currentUserId,
}) => {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Get responsive layout classes
  const { getTicketCardLayout } = useResponsiveLayout();
  const { textClasses } = useResponsiveClasses();
  const layout = getTicketCardLayout;

  // Show Urgent badge for valued customers
  const showUrgentBadge = ticket.customer_type === 'valued';

  // Get display ID with fallback to UUID
  const displayId = ticket.display_id || ticket.inquiry_id;

  // Format customer name
  const customerName =
    ticket.customer_full_name ||
    (ticket.customer_first_name && ticket.customer_last_name
      ? `${ticket.customer_first_name} ${ticket.customer_last_name}`
      : 'Customer');

  // Format inquiry type for display
  const inquiryType = formatInquiryType(ticket.inquiry_type || 'other');

  // Format both received and updated dates with time
  const receivedDate = ticket.received_at
    ? formatDateWithTimeDesktop(ticket.received_at)
    : '—';

  // Use relative time format for updated dates
  const updatedDate = ticket.updated_at
    ? formatRelativeTimeLabel(ticket.updated_at)
    : '—';

  // Format resolved dates with time
  const resolvedDate = ticket.resolved_at
    ? formatDateWithTimeDesktop(ticket.resolved_at)
    : '—';

  const version = ticket.updated_at ?? ticket.received_at ?? null;

  useEffect(() => {
    if (!currentUserId || !ticket.updated_by || !version) return;
    if (ticket.updated_by !== currentUserId) return;
    onMarkViewed(ticket.inquiry_id, version);
  }, [
    currentUserId,
    onMarkViewed,
    ticket.inquiry_id,
    ticket.updated_by,
    version,
  ]);

  const handleMouseEnter = () => {
    // hover maintains legacy highlight state via container styles only
  };

  const handleViewInChat = () => {
    onMarkViewed(ticket.inquiry_id, version);
    onViewInChat(ticket.inquiry_id);
  };

  return (
    <div
      className={`group ${layout.container} ${
        isUnread ? 'border-blue-200 bg-blue-50/40' : ''
      }`}
      onMouseEnter={handleMouseEnter}
    >
      {/* Row 1: Ticket ID + Type | Status Badges */}
      <div className={layout.structure.row1}>
        <div className={layout.leftSection}>
          <div className={`flex items-center ${layout.elementGap} min-w-0`}>
            {isUnread && (
              <span
                className="w-2 h-2 bg-blue-500 rounded-full shrink-0"
                aria-hidden="true"
              />
            )}
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
          <div className="flex items-center gap-2">
            {/* Desktop/Tablet: User icon button */}
            <Button
              variant="ghost"
              size="sm"
              aria-label="View customer information"
              onClick={() => setIsCustomerModalOpen(true)}
              className="hidden sm:inline-flex shrink-0"
            >
              <User className="w-4 h-4" />
            </Button>
            <span className={layout.customerName}>{customerName}</span>
          </div>
        </div>

        {/* Desktop/Tablet: Chat button */}
        <div className="hidden sm:flex shrink-0">
          <Button
            variant="secondary"
            size="sm"
            threeD
            aria-label={`Ask about ${displayId}`}
            onClick={handleViewInChat}
            className="shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Row 3: Dates (stacked vertically) */}
      <div className="mt-1">
        <div
          className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
        >
          <span className="font-medium">Received:</span>
          <span className="truncate">{receivedDate}</span>
        </div>
        {ticket.resolved_at && (
          <div
            className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
          >
            <span className="font-medium">Resolved:</span>
            <span className="truncate">{resolvedDate}</span>
          </div>
        )}
        {ticket.updated_at && ticket.updated_at !== ticket.received_at && (
          <div
            className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
          >
            <span className="font-medium">Updated:</span>
            <span className="truncate">{updatedDate}</span>
          </div>
        )}
      </div>

      {/* Mobile: Text buttons below dates */}
      <div className="mt-3 sm:hidden space-y-2">
        <Button
          variant="secondary"
          size="sm"
          threeD
          onClick={handleViewInChat}
          className="w-full"
        >
          Chat with Printy
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCustomerModalOpen(true)}
          className="w-full"
        >
          See Customer Info
        </Button>
      </div>

      <CustomerInfoModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customerId={ticket.customer_id || null}
        customerName={customerName}
      />
    </div>
  );
};

export default TicketItem;
