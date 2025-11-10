/**
 * useAdminQuotes
 * Fetches all quotes from quotes table for admin view
 * Similar to useAdminOrders but for quotes with enhanced data structure
 */
import { useEffect, useState, useCallback, useRef } from 'react';
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
    customer_type?: string;
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
  customer_type?: string;
  product_name: string;
  quoted_amount: string;
  status: string;
  created_at: string;
  updated_at: string;
  ended_at?: string;
  accepted_at?: string;
  updated_by?: string | null;
  // Legacy fields for backward compatibility
  customer: string;
  total: string;
  date: string;
}

const DEFAULT_PAGE_SIZE = 25;

const normalizeQuote = (quote: any): AdminQuoteRow => {
  const customerData = Array.isArray(quote.customer)
    ? quote.customer[0]
    : quote.customer;
  const customerName =
    customerData?.first_name && customerData?.last_name
      ? `${customerData.first_name} ${customerData.last_name}`
      : customerData?.first_name ||
        customerData?.email_address ||
        quote.customer_id;

  const latestProposal = Array.isArray(quote.latest_proposal)
    ? quote.latest_proposal[0]
    : quote.latest_proposal;

  const productName = quote.display_id
    ? `Quote ${quote.display_id}`
    : `Quote ${quote.quote_id.slice(0, 8)}`;

  const quotedAmount = latestProposal
    ? `₱${Number(latestProposal.quoted_price).toLocaleString()}`
    : 'Not quoted';

  // Persist accepted_at even if status later becomes 'ended':
  // Prefer linked order.created_at when available; otherwise, if the current
  // record is in accepted state, fall back to updated_at at the time of acceptance.
  const orderCreatedAt = Array.isArray(quote.order)
    ? quote.order[0]?.created_at
    : quote.order?.created_at;
  const acceptedAt =
    orderCreatedAt ||
    (quote.status === 'accepted' ? quote.updated_at : undefined);

  return {
    id: quote.display_id || quote.quote_id,
    session_id: quote.session_id,
    customer_id: quote.customer_id,
    display_id: quote.display_id,
    customer_name: customerName,
    customer_email: customerData?.email_address,
    customer_type: customerData?.customer_type,
    product_name: productName,
    quoted_amount: quotedAmount,
    status: quote.status,
    created_at: quote.created_at,
    updated_at: quote.updated_at,
    ended_at: quote.ended_at,
    accepted_at: acceptedAt,
    updated_by: quote.updated_by || null,
    customer: customerName,
    total: quotedAmount,
    date: new Date(quote.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
  };
};

/**
 * Fetches quotes from the database for admin view with server-side pagination.
 * Client code can call `loadAll` when a full dataset is required (e.g., export/search).
 */
export function useAdminQuotes(pageSize: number = DEFAULT_PAGE_SIZE) {
  const [quotes, setQuotes] = useState<AdminQuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadedPagesRef = useRef<Set<number>>(new Set());

  const fetchPage = useCallback(
    async (page: number, replaceExisting: boolean = page === 1) => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      if (replaceExisting) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
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
            updated_by,
            ended_at,
            display_id,
            customer:customer_id(
              first_name,
              last_name,
              email_address,
              customer_type
            ),
            latest_proposal:quote_proposals(
              proposal_id,
              quoted_price,
              created_at,
              updated_at
            ),
            order:orders!quote_id(
              created_at
            )
          `,
            { count: 'exact' }
          )
          .order('created_at', {
            ascending: false,
            foreignTable: 'quote_proposals',
          })
          .limit(1, { foreignTable: 'quote_proposals' })
          .order('updated_at', { ascending: false })
          .range(from, to);

        if (error) {
          console.error('[useAdminQuotes] Error fetching quotes:', error);
          setError(error.message);
          return;
        }

        const normalized = (data || []).map(normalizeQuote);

        setTotalCount(count || 0);
        loadedPagesRef.current.add(page);

        setQuotes(prev => {
          if (replaceExisting) {
            // Sort by updated_at descending (latest first)
            return normalized.sort(
              (a, b) =>
                new Date(b.updated_at || 0).getTime() -
                new Date(a.updated_at || 0).getTime()
            );
          }

          const merged = [...prev];
          for (const quote of normalized) {
            const existingIndex = merged.findIndex(
              q => q.session_id === quote.session_id
            );
            if (existingIndex >= 0) {
              merged[existingIndex] = quote;
            } else {
              merged.push(quote);
            }
          }

          // Sort by updated_at descending (latest first)
          return merged.sort(
            (a, b) =>
              new Date(b.updated_at || 0).getTime() -
              new Date(a.updated_at || 0).getTime()
          );
        });
      } catch (e: any) {
        console.error('[useAdminQuotes] Unexpected error:', e);
        setError(e?.message || 'Unknown error occurred');
      } finally {
        if (replaceExisting) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [pageSize]
  );

  const loadInitial = useCallback(async () => {
    loadedPagesRef.current.clear();
    await fetchPage(1, true);
    setCurrentPage(1);
  }, [fetchPage]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  // Real-time subscription for quotes table changes with efficient local state merging
  useEffect(() => {
    const channel = supabase
      .channel('quotes-changes-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
        },
        async payload => {
          const quoteId =
            (payload.new as any)?.quote_id || (payload.old as any)?.quote_id;
          if (!quoteId) return;

          // Handle DELETE: remove from local state
          if (payload.eventType === 'DELETE') {
            setQuotes(prev =>
              prev.filter(q => q.id !== quoteId && q.session_id !== quoteId)
            );
            setTotalCount(prev => Math.max(0, prev - 1));
            return;
          }

          // Handle INSERT/UPDATE: fetch single row with joins and merge into state
          try {
            const { data, error } = await supabase
              .from('quotes')
              .select(
                `
                quote_id,
                session_id,
                customer_id,
                status,
                created_at,
                updated_at,
            updated_by,
                ended_at,
                display_id,
                customer:customer_id(
                  first_name,
                  last_name,
                  email_address,
                  customer_type
                ),
                latest_proposal:quote_proposals(
                  proposal_id,
                  quoted_price,
                  created_at,
                  updated_at
                ),
                order:orders!quote_id(
                  created_at
                )
              `
              )
              .eq('quote_id', quoteId)
              .order('created_at', {
                ascending: false,
                foreignTable: 'quote_proposals',
              })
              .limit(1, { foreignTable: 'quote_proposals' })
              .single();

            if (error || !data) {
              console.error(
                '[useAdminQuotes] Error fetching updated quote:',
                error
              );
              return;
            }

            // Normalize the fetched quote
            const normalizedQuote = normalizeQuote(data);

            // Merge into state
            setQuotes(prev => {
              const existingIndex = prev.findIndex(
                q => q.session_id === normalizedQuote.session_id
              );
              if (existingIndex >= 0) {
                // Update existing quote
                const updated = [...prev];
                updated[existingIndex] = normalizedQuote;
                // Sort by updated_at descending (latest first)
                return updated.sort(
                  (a, b) =>
                    new Date(b.updated_at || 0).getTime() -
                    new Date(a.updated_at || 0).getTime()
                );
              } else {
                // Insert new quote and sort by updated_at descending (latest first)
                return [normalizedQuote, ...prev].sort(
                  (a, b) =>
                    new Date(b.updated_at || 0).getTime() -
                    new Date(a.updated_at || 0).getTime()
                );
              }
            });

            // Update total count for new inserts
            if (payload.eventType === 'INSERT') {
              setTotalCount(prev => prev + 1);
            }
          } catch (e) {
            console.error(
              '[useAdminQuotes] Error processing realtime update:',
              e
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const hasMore = totalCount > quotes.length;

  const loadMore = useCallback(async () => {
    if (loadingAll || loadingMore) return;
    const nextPage = currentPage + 1;
    if (loadedPagesRef.current.has(nextPage)) return;
    await fetchPage(nextPage, false);
    setCurrentPage(nextPage);
  }, [currentPage, fetchPage, loadingAll, loadingMore]);

  const loadAll = useCallback(async () => {
    if (loadingAll || !hasMore) return;
    setLoadingAll(true);
    try {
      const totalPages = Math.ceil(totalCount / pageSize);
      for (let page = currentPage + 1; page <= totalPages; page += 1) {
        if (loadedPagesRef.current.has(page)) continue;
        await fetchPage(page, false);
      }
    } finally {
      setLoadingAll(false);
    }
  }, [currentPage, fetchPage, hasMore, loadingAll, pageSize, totalCount]);

  const refresh = useCallback(() => {
    void loadInitial();
  }, [loadInitial]);

  return {
    quotes,
    loading,
    error,
    totalCount,
    hasMore,
    loadMore,
    loadAll,
    loadingAll,
    loadingMore,
    refresh,
  };
}
