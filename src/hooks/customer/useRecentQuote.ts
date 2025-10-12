// src/hooks/customer/useRecentQuote.ts

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { RecentQuote } from '../../types/customer';
import { fetchRecentQuoteConversations } from '../../features/api/quoteApi';

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
        const conversations = await fetchRecentQuoteConversations(customerId);
        
        if (conversations.length > 0) {
          const latest = conversations[0];
          setRecentQuote({
            id: latest.conversation_id,
            subject: `Quote Request #${latest.quote_id ? latest.quote_id.slice(0, 8) : latest.conversation_id.slice(0, 8)}`,
            status: latest.status,
            updatedAt: new Date(latest.updated_at).getTime()
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
