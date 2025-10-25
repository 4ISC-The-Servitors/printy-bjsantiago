/**
 * useAdminQuotes
 * Fetches all quotes from quotes table for admin view
 * Similar to useAdminOrders but for quotes with enhanced data structure
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@lib/supabase';

export interface AdminQuoteData {
  quote_id: string;
  session_id: string;
  display_id?: string;
  customer_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  ended_at?: string;
  customer?: {
    first_name?: string;
    last_name?: string;
    email_address?: string;
  };
  proposals?: {
    proposal_id: string;
    quoted_price: number;
    created_at: string;
    updated_at: string;
  }[];
}

export interface AdminQuoteRow {
  id: string;
  session_id: string; // Chat session ID for navigation
  customer_id: string;
  display_id?: string;
  customer_name: string;
  customer_email?: string;
  product_name: string;
  quoted_amount: string;
  status: string;
  created_at: string;
  updated_at: string;
  ended_at?: string;
  // Legacy fields for backward compatibility
  customer: string;
  total: string;
  date: string;
}

interface LoadQuotesOptions {
  page?: number;
  pageSize?: number;
}

export function useAdminQuotes(options: LoadQuotesOptions = {}) {
  const { page = 1, pageSize = 10 } = options;
  const [quotes, setQuotes] = useState<AdminQuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const from = (page - 1) * pageSize;

      // Fetch quotes with customer information (no nested proposals; proposals are linked via session_id)
      const { data, error, count } = await supabase
        .from('quotes')
        .select(
          `
          quote_id,
          session_id,
          customer_id,
          status,
          created_at,
          updated_at,
          ended_at,
          display_id,
          customer:customer_id(
            first_name,
            last_name,
            email_address
          )
        `,
          { count: 'exact' }
        )
        .order('updated_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('[useAdminQuotes] Error fetching quotes:', error);
        setError(error.message);
        return;
      }


      // Build a lookup of latest proposal by session_id
      const sessionIds: string[] = (data || [])
        .map((q: any) => q.session_id)
        .filter(Boolean);
      let latestBySessionId: Record<string, any> = {};
      if (sessionIds.length > 0) {
        const { data: proposalsData } = await supabase
          .from('quote_proposals')
          .select(
            'session_id, proposal_id, quoted_price, created_at, updated_at'
          )
          .in('session_id', sessionIds);

        if (Array.isArray(proposalsData)) {
          for (const p of proposalsData) {
            const existing = latestBySessionId[p.session_id];
            const isNewer =
              !existing ||
              new Date(p.created_at).getTime() >
                new Date(existing.created_at).getTime();
            if (isNewer) latestBySessionId[p.session_id] = p;
          }
        }
      }

      const normalized: AdminQuoteRow[] = (data || []).map((quote: any) => {
        // Handle customer data - it might be an array or object
        const customerData = Array.isArray(quote.customer)
          ? quote.customer[0]
          : quote.customer;
        const customerName =
          customerData?.first_name && customerData?.last_name
            ? `${customerData.first_name} ${customerData.last_name}`
            : customerData?.first_name ||
              customerData?.email_address ||
              quote.customer_id;

        // Get latest proposal for pricing info via session_id
        const latestProposal = latestBySessionId[quote.session_id] || null;

        // Generate product name from display_id or quote_id
        const productName = quote.display_id
          ? `Quote ${quote.display_id}`
          : `Quote ${quote.quote_id.slice(0, 8)}`;

        // Format quoted amount - always use ₱ symbol
        const quotedAmount = latestProposal
          ? `₱${Number(latestProposal.quoted_price).toLocaleString()}`
          : 'Not quoted';

        return {
          id: quote.display_id || quote.quote_id,
          session_id: quote.session_id, // Session ID for chat flow navigation
          customer_id: quote.customer_id,
          display_id: quote.display_id,
          customer_name: customerName,
          customer_email: customerData?.email_address,
          product_name: productName,
          quoted_amount: quotedAmount,
          status: quote.status,
          created_at: quote.created_at,
          updated_at: quote.updated_at,
          ended_at: quote.ended_at,
          // Legacy fields for backward compatibility
          customer: customerName,
          total: quotedAmount,
          date: new Date(quote.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        };
      });

      setQuotes(normalized);
      setTotalCount(count || 0);
    } catch (e: any) {
      console.error('[useAdminQuotes] Unexpected error:', e);
      setError(e?.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  // Load quotes on mount and when dependencies change
  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // Add real-time subscription for quotes table changes
  useEffect(() => {
    const channel = supabase
      .channel('quotes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotes' },
        () => {
          void loadQuotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadQuotes]);

  const refresh = useCallback(() => {
    loadQuotes();
  }, [loadQuotes]);

  return {
    quotes,
    loading,
    error,
    totalCount,
    refresh,
  };
}
