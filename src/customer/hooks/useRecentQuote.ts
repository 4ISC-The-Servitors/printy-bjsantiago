// src/hooks/customer/useRecentQuote.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@lib/supabase';
import { getCustomerQuotes } from '@features/chat/api/sessionQueries';
import { formatCurrency } from '@shared/utils/priceFormatter';
import type { RecentQuote } from '@shared/types/customer';

export function useRecentQuote(customerId?: string) {
  const [recentQuote, setRecentQuote] = useState<RecentQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecentQuote = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      // Use new sessionQueries to get customer quotes
      const quotes = await getCustomerQuotes(customerId);
      const latestQuote = quotes[0]; // Most recent quote

      if (latestQuote) {
        let quotedPrice: string | undefined;
        if (latestQuote.quoted_price) {
          quotedPrice = formatCurrency(Number(latestQuote.quoted_price));
        }

        // Set acceptedAt or rejectedAt based on status
        const updatedAt = latestQuote.updatedAt || latestQuote.createdAt;
        const acceptedAt =
          latestQuote.status === 'accepted' ? updatedAt : undefined;
        const rejectedAt =
          latestQuote.status === 'rejected' ? updatedAt : undefined;

        setRecentQuote({
          id: latestQuote.quote_id,
          displayId:
            latestQuote.displayId ||
            latestQuote.quote_id.slice(0, 8).toUpperCase(),
          status: latestQuote.status as any, // Type casting due to v2 schema differences
          quotedPrice,
          createdAt: latestQuote.createdAt,
          updatedAt: updatedAt,
          endedAt: latestQuote.endedAt,
          acceptedAt: acceptedAt,
          rejectedAt: rejectedAt,
        });
      } else {
        setRecentQuote(null);
      }

      setError(null);
    } catch (err) {
      console.error('Error loading recent quote:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load recent quote'
      );
      setRecentQuote(null);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadRecentQuote();
  }, [loadRecentQuote]);

  // Add real-time subscription for quotes table changes
  useEffect(() => {
    if (!customerId) return;

    const channel = supabase
      .channel('customer-quotes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          void loadRecentQuote();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, loadRecentQuote]);

  return {
    data: recentQuote,
    loading,
    error,
  };
}
