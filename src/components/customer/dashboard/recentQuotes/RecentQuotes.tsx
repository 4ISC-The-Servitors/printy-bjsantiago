import React from 'react';
import { Card, Text } from '../../../shared';
import type { RecentQuote } from '../../../../types/customer';
import QuoteSubject from './QuoteSubject';
import QuoteID from './QuoteID';
import StatusBadge from './StatusBadge';
import TrackQuoteButton from './TrackQuoteButton';

interface RecentQuotesProps {
  recentQuote: RecentQuote;
}

const RecentQuotes: React.FC<RecentQuotesProps> = ({ recentQuote }) => {
  return (
    <Card className="p-6">
      <Text variant="h3" size="lg" weight="semibold" className="mb-4">
        Recent Quote
      </Text>
      <div className="space-y-2">
        <QuoteSubject subject={recentQuote.subject} />
        <QuoteID id={recentQuote.id} />
        <StatusBadge status={recentQuote.status} />
      </div>
      <div className="mt-4">
        <TrackQuoteButton 
          conversationId={recentQuote.id} 
          subject={recentQuote.subject} 
        />
      </div>
    </Card>
  );
};

export default RecentQuotes;
