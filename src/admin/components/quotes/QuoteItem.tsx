import React from 'react';
import { Badge, Button } from '@admin/components/shared';
import { getQuoteStatusBadgeVariant } from '@shared/utils/statusColors';
import { formatQuoteStatus } from '@shared/utils/statusFormatter';
import {
  formatDateWithTimeDesktop,
  formatDateWithTimeTablet,
  formatDateWithTimeMobile,
} from '@shared/utils/dateFormatter';
import { formatRelativeTimeLabel } from '@shared/utils/timeFormatter';
import { MessageSquare } from 'lucide-react';
import type { AdminQuoteRow } from '@admin/hooks/useAdminQuotes';
import { useResponsiveLayout } from '@shared/hooks/ui';

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
  // Get responsive layout classes
  const { getQuoteCardLayout } = useResponsiveLayout();
  const layout = getQuoteCardLayout;

  // Get display ID with fallback to UUID
  const displayId = quote.display_id || quote.id;

  // Format dates responsively with time
  const createdDateDesktop = formatDateWithTimeDesktop(quote.created_at);
  const createdDateTablet = formatDateWithTimeTablet(quote.created_at);
  const createdDateMobile = formatDateWithTimeMobile(quote.created_at);

  // Use ended_at if status is 'ended', otherwise use updated_at
  const isEnded = quote.status === 'ended';
  const lastActionDate =
    isEnded && quote.ended_at ? quote.ended_at : quote.updated_at;
  const lastActionLabel = isEnded ? 'Ended' : 'Updated';

  // For "Updated" dates, use relative time format; for "Ended" dates, use regular date format
  const useRelativeTime = !isEnded && lastActionDate;

  const lastActionDateDesktop = useRelativeTime
    ? formatRelativeTimeLabel(lastActionDate)
    : formatDateWithTimeDesktop(lastActionDate);
  const lastActionDateTablet = useRelativeTime
    ? formatRelativeTimeLabel(lastActionDate)
    : formatDateWithTimeTablet(lastActionDate);
  const lastActionDateMobile = useRelativeTime
    ? formatRelativeTimeLabel(lastActionDate)
    : formatDateWithTimeMobile(lastActionDate);

  // For accepted/rejected dates, always use date with time format (not relative time)
  const acceptedRejectedDateDesktop = formatDateWithTimeDesktop(quote.updated_at);
  const acceptedRejectedDateTablet = formatDateWithTimeTablet(quote.updated_at);
  const acceptedRejectedDateMobile = formatDateWithTimeMobile(quote.updated_at);

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
          <span className={layout.customerName}>{quote.customer_name}</span>
        </div>

        <div className="text-right">
          <div className={layout.amount}>{quote.quoted_amount}</div>
        </div>
      </div>

      {/* Row 3: Chat Button and Dates */}
      <div className={layout.structure.row3}>
        <div className={layout.dates}>
          <span className="hidden lg:inline">
            Created: {createdDateDesktop} • {lastActionLabel}:{' '}
            {lastActionDateDesktop}
            {quote.status === 'accepted' && (
              <> • Accepted: {acceptedRejectedDateDesktop}</>
            )}
            {quote.status === 'rejected' && (
              <> • Rejected: {acceptedRejectedDateDesktop}</>
            )}
          </span>
          <span className="hidden sm:inline lg:hidden">
            Created: {createdDateTablet} • {lastActionLabel}:{' '}
            {lastActionDateTablet}
            {quote.status === 'accepted' && (
              <> • Accepted: {acceptedRejectedDateTablet}</>
            )}
            {quote.status === 'rejected' && (
              <> • Rejected: {acceptedRejectedDateTablet}</>
            )}
          </span>
          <span className="sm:hidden">
            Created: {createdDateMobile} • {lastActionLabel}:{' '}
            {lastActionDateMobile}
            {quote.status === 'accepted' && (
              <> • Accepted: {acceptedRejectedDateMobile}</>
            )}
            {quote.status === 'rejected' && (
              <> • Rejected: {acceptedRejectedDateMobile}</>
            )}
          </span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          threeD
          aria-label={`Ask about ${displayId}`}
          onClick={() => onViewInChat(quote.id)}
          className={layout.chatButton}
        >
          <MessageSquare className={layout.chatIcon} />
        </Button>
      </div>
    </div>
  );
};

export default QuoteItem;
