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
        const { data, error } = await supabase
          .from('quotes')
          .select(`
            quote_id,
            session_id,
            display_id,
            status,
            created_at,
            updated_at,
            ended_at
          `)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setRecentQuote({
            id: data.quote_id,
            displayId: data.display_id || data.quote_id.slice(0, 8).toUpperCase(),
            subject: `Quote Request #${data.display_id || data.quote_id.slice(0, 8).toUpperCase()}`,
            status: data.status,
            createdAt: new Date(data.created_at).getTime(),
            updatedAt: new Date(data.updated_at).getTime(),
            endedAt: data.ended_at ? new Date(data.ended_at).getTime() : undefined
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
