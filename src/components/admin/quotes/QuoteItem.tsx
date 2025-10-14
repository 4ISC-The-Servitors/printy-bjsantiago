import React from 'react';
import { Badge } from '../../shared';
import { getQuoteStatusBadgeVariant } from '../../../utils/admin/statusColors';
import { formatQuoteStatus } from '../../../utils/shared/statusFormatter';
import { 
  formatOrderDateDesktop, 
  formatOrderDateTablet, 
  formatOrderDateMobile 
} from '../../../utils/shared/dateFormatter';
import { formatRelativeTimeLabel } from '../../../utils/shared/timeFormatter';
import type { AdminQuoteRow } from '../../../hooks/admin/useAdminQuotes';
import { useResponsiveLayout } from '../../../hooks/ui';

// Use AdminQuoteRow type instead of local Quote interface
type Quote = AdminQuoteRow;

interface QuoteItemProps {
  quote: Quote;
  onHover: (quoteId: string | null) => void;
}

export const QuoteItem: React.FC<QuoteItemProps> = ({
  quote,
  onHover,
}) => {
  // Get responsive layout classes
  const { getQuoteCardLayout } = useResponsiveLayout();
  const layout = getQuoteCardLayout;
  
  // Get display ID with fallback to UUID
  const displayId = quote.display_id || quote.id;
  
  // Format dates responsively
  const createdDateDesktop = formatOrderDateDesktop(quote.created_at);
  const createdDateTablet = formatOrderDateTablet(quote.created_at);
  const createdDateMobile = formatOrderDateMobile(quote.created_at);
  
  // Use ended_at if status is 'ended', otherwise use updated_at
  const isEnded = quote.status === 'ended';
  const lastActionDate = isEnded && quote.ended_at ? quote.ended_at : quote.updated_at;
  const lastActionLabel = isEnded ? 'Ended' : 'Updated';
  
  // For "Updated" dates, use relative time format; for "Ended" dates, use regular date format
  const useRelativeTime = !isEnded && lastActionDate;
  
  const lastActionDateDesktop = useRelativeTime 
    ? formatRelativeTimeLabel(lastActionDate)
    : formatOrderDateDesktop(lastActionDate);
  const lastActionDateTablet = useRelativeTime 
    ? formatRelativeTimeLabel(lastActionDate)
    : formatOrderDateTablet(lastActionDate);
  const lastActionDateMobile = useRelativeTime 
    ? formatRelativeTimeLabel(lastActionDate)
    : formatOrderDateMobile(lastActionDate);

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

      {/* Row 3: Dates */}
      <div className={layout.structure.row3}>
        <div className={layout.dates}>
          <span className="hidden lg:inline">
            Created: {createdDateDesktop} • {lastActionLabel}: {lastActionDateDesktop}
          </span>
          <span className="hidden sm:inline lg:hidden">
            Created: {createdDateTablet} • {lastActionLabel}: {lastActionDateTablet}
          </span>
          <span className="sm:hidden">
            Created: {createdDateMobile} • {lastActionLabel}: {lastActionDateMobile}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuoteItem;