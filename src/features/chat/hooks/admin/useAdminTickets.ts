import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { supabase } from '@lib/supabase';

export type AdminTicketRow = {
  inquiry_id: string;
  display_id?: string | null;
  inquiry_status: string | null;
  inquiry_type: string | null;
  customer_id: string | null;
  received_at: string | null;
  updated_at: string | null;
  resolved_at?: string | null;
  order_id?: string | null;
  session_id?: string | null;
  customer_full_name?: string | null;
  customer_first_name?: string | null;
  customer_last_name?: string | null;
  customer_type?: string | null;
  updated_by?: string | null;
};

type LoadInquiriesOptions = {
  page?: number;
  pageSize?: number;
  useAdvancedFallbacks?: boolean;
};

const DEFAULT_PAGE_SIZE = 25;

export function useAdminTickets(options: LoadInquiriesOptions = {}) {
  const { pageSize = DEFAULT_PAGE_SIZE, useAdvancedFallbacks = false } =
    options;

  const [tickets, setTickets] = useState<AdminTicketRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [loadingAll, setLoadingAll] = useState<boolean>(false);
  const loadedPagesRef = useRef<Set<number>>(new Set());

  const fetchPage = useCallback(
    async (page: number, replace: boolean = page === 1) => {
      const from = (page - 1) * pageSize;
      if (replace) {
        setLoading(true);
      } else {
        if (loadingMore) return;
        setLoadingMore(true);
      }
      setError(null);

      try {
        let rows: any[] = [];

        if (useAdvancedFallbacks) {
          // Try admin RPC first (if available)
          const { data, error } = await supabase.rpc(
            'api_inquiries_admin_list',
            {
              p_limit: pageSize,
              p_offset: from,
            }
          );

          // Only use RPC if it succeeds - otherwise fall back to direct query
          if (!error && Array.isArray(data) && data.length > 0) {
            rows = data as any[];
          } else {
            // Fallback: direct read from inquiries_v2 with customer join
            const {
              data: viewRows,
              error: viewErr,
              count,
            } = await supabase
              .from('inquiries_v2')
              .select(
                'inquiry_id, display_id, customer_id, inquiry_type, inquiry_status, received_at, updated_at, resolved_at, order_id, session_id, updated_by, customer:customer_id(first_name,last_name,customer_type)',
                { count: 'exact' }
              )
              .order('updated_at', { ascending: false })
              .range(from, from + pageSize - 1);
            if (!viewErr && Array.isArray(viewRows)) {
              rows = viewRows as any[];
              setTotalCount(count || 0);
            }
          }
        } else {
          // Direct query: inquiries_v2 with proper customer join
          const res = await supabase
            .from('inquiries_v2')
            .select(
              'inquiry_id,display_id,inquiry_status,inquiry_type,customer_id,received_at,updated_at,resolved_at,order_id,session_id,updated_by,customer:customer_id(first_name,last_name,customer_type)',
              { count: 'exact' }
            )
            .order('updated_at', { ascending: false })
            .range(from, from + pageSize - 1);

          if (res.error) throw res.error;

          rows = (res.data as any[]) || [];
          setTotalCount(res.count || 0);
        }

        const normalized: AdminTicketRow[] = (rows || []).map(row => {
          // Handle customer data - it might be an array or object
          const customerData = Array.isArray((row as any).customer)
            ? (row as any).customer[0]
            : (row as any).customer;

          const first =
            (row as any).customer_first_name || customerData?.first_name || '';
          const last =
            (row as any).customer_last_name || customerData?.last_name || '';
          const full = `${first} ${last}`.trim() || null;

          const normalizedRow = {
            inquiry_id: (row as any).inquiry_id,
            display_id: (row as any).display_id ?? null,
            inquiry_status: (row as any).inquiry_status ?? null,
            inquiry_type: (row as any).inquiry_type ?? null,
            customer_id: (row as any).customer_id ?? null,
            received_at: (row as any).received_at ?? null,
            updated_at: (row as any).updated_at ?? null,
            resolved_at: (row as any).resolved_at ?? null,
            order_id: (row as any).order_id ?? null,
            session_id: (row as any).session_id ?? null,
            customer_full_name: full,
            customer_first_name: first || null,
            customer_last_name: last || null,
            customer_type: customerData?.customer_type ?? null,
            updated_by: (row as any).updated_by ?? null,
          } as AdminTicketRow;

          return normalizedRow;
        });

        if (replace) {
          // Sort by updated_at descending (latest first)
          const sorted = normalized.sort(
            (a, b) =>
              new Date(b.updated_at || 0).getTime() -
              new Date(a.updated_at || 0).getTime()
          );
          setTickets(sorted);
        } else {
          setTickets(prev => {
            const merged = [...prev];
            for (const row of normalized) {
              const i = merged.findIndex(t => t.inquiry_id === row.inquiry_id);
              if (i >= 0) merged[i] = row;
              else merged.push(row);
            }
            // Sort by updated_at descending (latest first)
            return merged.sort(
              (a, b) =>
                new Date(b.updated_at || 0).getTime() -
                new Date(a.updated_at || 0).getTime()
            );
          });
        }

        loadedPagesRef.current.add(page);

        if (!activeId && normalized.length > 0 && replace) {
          setActiveId(normalized[0].inquiry_id);
        }
      } catch (e: any) {
        console.error('Failed to load inquiries', e);
        setError('Unable to load inquiries.');
        if (replace) {
          setTickets([]);
        }
      } finally {
        if (replace) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [pageSize, useAdvancedFallbacks]
  );

  useEffect(() => {
    loadedPagesRef.current.clear();
    void fetchPage(1, true);
    setCurrentPage(1);
  }, [fetchPage]);

  useEffect(() => {
    // Helper to fetch a single ticket row with joins and normalize it
    const fetchAndMergeTicket = async (inquiryId: string) => {
      const { data, error } = await supabase
        .from('inquiries_v2')
        .select(
          'inquiry_id,display_id,inquiry_status,inquiry_type,customer_id,received_at,updated_at,resolved_at,order_id,session_id,updated_by,customer:customer_id(first_name,last_name,customer_type)'
        )
        .eq('inquiry_id', inquiryId)
        .single();
      if (error) return;

      const customerData = Array.isArray((data as any).customer)
        ? (data as any).customer[0]
        : (data as any).customer;
      const first = customerData?.first_name || '';
      const last = customerData?.last_name || '';
      const full = `${first} ${last}`.trim() || null;

      const normalized: AdminTicketRow = {
        inquiry_id: (data as any).inquiry_id,
        display_id: (data as any).display_id ?? null,
        inquiry_status: (data as any).inquiry_status ?? null,
        inquiry_type: (data as any).inquiry_type ?? null,
        customer_id: (data as any).customer_id ?? null,
        received_at: (data as any).received_at ?? null,
        updated_at: (data as any).updated_at ?? null,
        resolved_at: (data as any).resolved_at ?? null,
        order_id: (data as any).order_id ?? null,
        session_id: (data as any).session_id ?? null,
        customer_full_name: full,
        customer_first_name: first || null,
        customer_last_name: last || null,
        customer_type: customerData?.customer_type ?? null,
        updated_by: (data as any).updated_by ?? null,
      };

      setTickets(prev => {
        const i = prev.findIndex(t => t.inquiry_id === normalized.inquiry_id);
        if (i >= 0) {
          const next = [...prev];
          next[i] = normalized;
          // Sort by updated_at descending (latest first)
          return next.sort(
            (a, b) =>
              new Date(b.updated_at || 0).getTime() -
              new Date(a.updated_at || 0).getTime()
          );
        }
        // Insert new ticket and sort by updated_at descending (latest first)
        return [normalized, ...prev].sort(
          (a, b) =>
            new Date(b.updated_at || 0).getTime() -
            new Date(a.updated_at || 0).getTime()
        );
      });
    };

    const channel = supabase
      .channel('inquiries_v2-admin-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inquiries_v2' },
        async payload => {
          const newRow: any = payload.new;
          const oldRow: any = payload.old;
          const id =
            (newRow && (newRow.inquiry_id || newRow.id)) ||
            (oldRow && (oldRow.inquiry_id || oldRow.id));
          if (!id) return;

          if (payload.eventType === 'DELETE') {
            setTickets(prev => prev.filter(t => t.inquiry_id !== id));
            return;
          }

          // INSERT or UPDATE: fetch the row with joins and merge
          await fetchAndMergeTicket(id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPage]);

  const active = useMemo(
    () => tickets.find(t => t.inquiry_id === activeId) || null,
    [tickets, activeId]
  );

  const hasMore = useMemo(
    () => totalCount > tickets.length,
    [totalCount, tickets.length]
  );

  return {
    tickets,
    active,
    activeId,
    setActiveId,
    loading,
    error,
    hasMore,
    totalCount,
    loadingMore,
    loadingAll,
    loadMore: async () => {
      if (!hasMore || loadingMore) return;
      const next = currentPage + 1;
      if (loadedPagesRef.current.has(next)) return;
      await fetchPage(next, false);
      setCurrentPage(next);
    },
    loadAll: async () => {
      if (loadingAll || !hasMore) return;
      setLoadingAll(true);
      try {
        const totalPages = Math.ceil(totalCount / pageSize);
        for (let p = 1; p <= totalPages; p += 1) {
          if (loadedPagesRef.current.has(p)) continue;
          await fetchPage(p, false);
        }
      } finally {
        setLoadingAll(false);
      }
    },
    reload: () => {
      loadedPagesRef.current.clear();
      void fetchPage(1, true);
      setCurrentPage(1);
    },
  };
}
