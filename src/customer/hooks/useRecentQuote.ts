// src/hooks/customer/useRecentQuote.ts

import { useState, useEffect } from 'react';
import { getCustomerQuotes } from '@features/chat/api/sessionQueries';
import type { RecentQuote } from '@shared/types/customer';

export function useRecentQuote(customerId?: string) {
  const [recentQuote, setRecentQuote] = useState<RecentQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecentQuote = async () => {
      if (!customerId) {
        setLoading(false);
        return;
      }

      try {
        // Use new sessionQueries to get customer quotes
        const quotes = await getCustomerQuotes(customerId);
        const latestQuote = quotes[0]; // Most recent quote

        if (latestQuote) {
          setRecentQuote({
            id: latestQuote.quoteId,
            displayId: latestQuote.displayId || latestQuote.quoteId.slice(0, 8).toUpperCase(),
            status: latestQuote.status,
            createdAt: latestQuote.createdAt,
            updatedAt: latestQuote.updatedAt,
            endedAt: latestQuote.endedAt
          });
        } else {
          setRecentQuote(null);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading recent quote:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recent quote');
        setRecentQuote(null);
      } finally {
        setLoading(false);
      }
    };

    loadRecentQuote();
  }, [customerId]);

  return {
    data: recentQuote,
    loading,
    error
  };
}
