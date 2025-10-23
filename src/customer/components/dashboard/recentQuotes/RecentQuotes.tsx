import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Text, Button } from '@shared/components';
import { useResponsiveLayout, useResponsiveClasses } from '@shared/hooks/ui';
import type { RecentQuote } from '@shared/types/customer';
import StatusBadge from './StatusBadge';
import TrackQuoteButton from './TrackQuoteButton';
import { formatShortDate } from '@shared/utils/dateFormatter';
import { formatRelativeTimeLabel } from '@shared/utils/timeFormatter';

interface RecentQuotesProps {
  recentQuote: RecentQuote;
}

const RecentQuotes: React.FC<RecentQuotesProps> = ({ recentQuote }) => {
  const navigate = useNavigate();
  const { getQuoteCardLayout } = useResponsiveLayout();
  const { textClasses } = useResponsiveClasses();
  const layout = getQuoteCardLayout;

  return (
    <Card className="device-spacing-component">
      <div className="flex items-center justify-between mb-4">
        <Text
          variant="h3"
          className="device-text-heading"
          size="lg"
          weight="semibold"
        >
          Recent Quote
        </Text>
        <Button
          variant="ghost"
          className="device-btn-secondary text-brand-primary hover:text-brand-primary-600"
          onClick={() => navigate('/customer/quotes')}
        >
          View all
        </Button>
      </div>
      <div className="space-y-3">
        {/* Row 1: Quote ID | Status */}
        <div className={layout.structure.row1}>
          <div className={layout.leftSection}>
            <div className={`flex items-center ${layout.elementGap} min-w-0`}>
              <span className={`${layout.orderId} device-text-fraunces`}>
                {recentQuote.displayId}
              </span>
            </div>
          </div>
          <div className={layout.badgeContainer}>
            <StatusBadge status={recentQuote.status} />
          </div>
        </div>

        {/* Row 2: Action */}
        <div className={layout.structure.row2}>
          <div className={layout.leftSection} />
          <div className={layout.rightSection}>
            <TrackQuoteButton
              conversationId={recentQuote.id}
              subject={recentQuote.displayId}
              status={recentQuote.status}
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
              {formatShortDate(recentQuote.createdAt)}
            </span>
          </div>
          <div
            className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
          >
            <span className="font-medium">Updated:</span>
            <span className="truncate">
              {formatRelativeTimeLabel(recentQuote.updatedAt)}
            </span>
          </div>
          {recentQuote.endedAt && (
            <div
              className={`flex items-center gap-2 text-neutral-500 ${textClasses.caption}`}
            >
              <span className="font-medium">Ended:</span>
              <span className="truncate">
                {formatShortDate(recentQuote.endedAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default RecentQuotes;
