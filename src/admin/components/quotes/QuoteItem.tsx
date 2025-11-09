import React, { useState } from 'react';
import { Badge, Button } from '@admin/components/shared';
import { CustomerInfoModal } from '@shared/components';
import { getQuoteStatusBadgeVariant } from '@shared/utils/statusColors';
import { formatQuoteStatus } from '@shared/utils/statusFormatter';
import { formatDateWithTimeDesktop } from '@shared/utils/dateFormatter';
import { formatRelativeTimeLabel } from '@shared/utils/timeFormatter';
import { MessageSquare, User } from 'lucide-react';
import type { AdminQuoteRow } from '@admin/hooks/useAdminQuotes';
import { useResponsiveLayout, useResponsiveClasses } from '@shared/hooks/ui';

// Use AdminQuoteRow type instead of local Quote interface
type Quote = AdminQuoteRow;

interface QuoteItemProps {
  quote: Quote;
  onHover: (quoteId: string | null) => void;
  onViewInChat: (quoteId: string) => void;
}

export const QuoteItem: React.FC<QuoteItemProps> = ({
  quote,
  onHover,
  onViewInChat,
}) => {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Get responsive layout classes
  const { getQuoteCardLayout } = useResponsiveLayout();
  const { textClasses } = useResponsiveClasses();
  const layout = getQuoteCardLayout;

  // Show Urgent badge for valued customers
  const showUrgentBadge = (quote as any)?.customer_type === 'valued';

  // Get display ID with fallback to UUID
  const displayId = quote.display_id || quote.id;

  // Format dates with time
  const createdDate = formatDateWithTimeDesktop(quote.created_at);

  // Use ended_at if status is 'ended', otherwise use updated_at
  const isEnded = quote.status === 'ended';
  const lastActionDateSource =
    isEnded && quote.ended_at ? quote.ended_at : quote.updated_at;
  const lastActionLabel = isEnded ? 'Ended' : 'Updated';

  // For "Updated" dates, use relative time format; for "Ended" dates, use regular date format
  const useRelativeTime = !isEnded && lastActionDateSource;

  const lastActionDate = useRelativeTime
    ? formatRelativeTimeLabel(lastActionDateSource)
    : formatDateWithTimeDesktop(lastActionDateSource);

  // For accepted/rejected dates, always use date with time format (not relative time)
  const acceptedRejectedDate = formatDateWithTimeDesktop(quote.updated_at);

  return (
    <div
      className={`group ${layout.container}`}
      onMouseEnter={() => onHover(quote.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Row 1: Quote ID + Product Name | Status Badge */}
      <div className={layout.structure.row1}>
        <div className={layout.leftSection}>
          <div className={`flex items-center ${layout.elementGap} min-w-0`}>
            <span className={layout.orderId}>{displayId}</span>
          </div>
        </div>

        <div className={layout.badgeContainer}>
          {showUrgentBadge && (
            <Badge variant="error" className={layout.statusBadge}>
              Urgent
            </Badge>
          )}
          <Badge
            variant={getQuoteStatusBadgeVariant(quote.status)}
            className={layout.statusBadge}
          >
            {formatQuoteStatus(quote.status)}
          </Badge>
        </div>
      </div>

      {/* Row 2: Customer Name | Quoted Amount */}
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
            <span className={layout.customerName}>{quote.customer_name}</span>
          </div>
        </div>

        <div className="text-right">
          <div className={layout.amount}>{quote.quoted_amount}</div>
        </div>
      </div>

      {/* Row 3: Chat Button and Dates */}
      <div className={layout.structure.row3}>
        {/* Dates stacked vertically */}
        <div className="mt-1 flex-1 min-w-0">
          <div
            className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
          >
            <span className="font-medium">Created:</span>
            <span className="truncate">{createdDate}</span>
          </div>
          <div
            className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
          >
            <span className="font-medium">{lastActionLabel}:</span>
            <span className="truncate">{lastActionDate}</span>
          </div>
          {quote.status === 'accepted' && (
            <div
              className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
            >
              <span className="font-medium">Accepted:</span>
              <span className="truncate">{acceptedRejectedDate}</span>
            </div>
          )}
          {quote.status === 'rejected' && (
            <div
              className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
            >
              <span className="font-medium">Rejected:</span>
              <span className="truncate">{acceptedRejectedDate}</span>
            </div>
          )}
        </div>

        {/* Desktop/Tablet: Chat button */}
        <div className="hidden sm:flex shrink-0">
          <Button
            variant="secondary"
            size="sm"
            threeD
            aria-label={`Ask about ${displayId}`}
            onClick={() => onViewInChat(quote.id)}
            className="shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile: Text buttons below dates */}
      <div className="mt-3 sm:hidden space-y-2">
        <Button
          variant="secondary"
          size="sm"
          threeD
          onClick={() => onViewInChat(quote.id)}
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
        customerId={quote.customer_id}
        customerName={quote.customer_name}
      />
    </div>
  );
};

export default QuoteItem;
