import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Text, Button } from '@shared/components';
import type { RecentQuote } from '@shared/types/customer';
import StatusBadge from './StatusBadge';
import TrackQuoteButton from './TrackQuoteButton';
import { formatLongDate } from '@shared/utils/dateFormatter';
import { formatRelativeTimeLabel } from '@shared/utils/timeFormatter';

interface RecentQuotesProps {
  recentQuote: RecentQuote;
}

const RecentQuotes: React.FC<RecentQuotesProps> = ({ recentQuote }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Text variant="h3" size="lg" weight="semibold">
          Recent Quote
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/customer/quotes')}
          className="text-brand-primary hover:text-brand-primary-600"
        >
          View all
        </Button>
      </div>
      <div className="space-y-3">
        {/* Primary row: Display ID + Status */}
        <div className="flex items-center justify-between">
          <Text variant="h3" size="base" weight="medium" className="font-mono">
            {recentQuote.displayId}
          </Text>
          <StatusBadge status={recentQuote.status} />
        </div>
        
        {/* Tertiary row: Important dates */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <Text variant="p" size="xs" color="muted">Created:</Text>
            <Text variant="p" size="xs" color="muted">{formatLongDate(recentQuote.createdAt)}</Text>
          </div>
          <div className="flex justify-between">
            <Text variant="p" size="xs" color="muted">Updated:</Text>
            <Text variant="p" size="xs" color="muted">{formatRelativeTimeLabel(recentQuote.updatedAt)}</Text>
          </div>
          {recentQuote.endedAt && (
            <div className="flex justify-between">
              <Text variant="p" size="xs" color="muted">Ended:</Text>
              <Text variant="p" size="xs" color="muted">{formatLongDate(recentQuote.endedAt)}</Text>
            </div>
          )}
        </div>
        
        {/* Action button */}
        <div className="pt-2">
          <TrackQuoteButton 
            conversationId={recentQuote.id} 
            subject={recentQuote.displayId}
            status={recentQuote.status}
          />
        </div>
      </div>
    </Card>
  );
};

export default RecentQuotes;
