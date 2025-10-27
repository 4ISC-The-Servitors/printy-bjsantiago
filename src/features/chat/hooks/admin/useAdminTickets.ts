import { useEffect, useMemo, useState, useCallback } from 'react';
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
};

type LoadInquiriesOptions = {
  page?: number;
  pageSize?: number;
  useAdvancedFallbacks?: boolean;
};

export function useAdminTickets(options: LoadInquiriesOptions = {}) {
  const { page = 1, pageSize = 10, useAdvancedFallbacks = false } = options;

  const [tickets, setTickets] = useState<AdminTicketRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    const from = (page - 1) * pageSize;

    try {
      let rows: any[] = [];

      if (useAdvancedFallbacks) {
        // Try admin RPC first (if available)
        const { data, error } = await supabase.rpc('api_inquiries_admin_list', {
          p_limit: pageSize,
          p_offset: from,
        });

        // Only use RPC if it succeeds - otherwise fall back to direct query
        if (!error && Array.isArray(data) && data.length > 0) {
          rows = data as any[];
        } else {
          // Fallback: direct read from inquiries_v2 with customer join
          const { data: viewRows, error: viewErr } = await supabase
            .from('inquiries_v2')
            .select(
              'inquiry_id, display_id, customer_id, inquiry_type, inquiry_status, received_at, updated_at, resolved_at, order_id, session_id, customer:customer_id(first_name,last_name,customer_type)'
            )
            .order('updated_at', { ascending: false })
            .range(from, from + pageSize - 1);
          if (!viewErr && Array.isArray(viewRows)) {
            rows = viewRows as any[];
          }
        }
      } else {
        // Direct query: inquiries_v2 with proper customer join
        const res = await supabase
          .from('inquiries_v2')
          .select(
            'inquiry_id,display_id,inquiry_status,inquiry_type,customer_id,received_at,updated_at,resolved_at,order_id,session_id,customer:customer_id(first_name,last_name,customer_type)'
          )
          .order('received_at', { ascending: false })
          .range(from, from + pageSize - 1);

        if (res.error) throw res.error;

        rows = (res.data as any[]) || [];
      }

      const normalized: AdminTicketRow[] = (rows || []).map(row => {
        const first =
          (row as any).customer_first_name ||
          (row as any).customer?.first_name ||
          '';
        const last =
          (row as any).customer_last_name ||
          (row as any).customer?.last_name ||
          '';
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
        } as AdminTicketRow;


        return normalizedRow;
      });

      setTickets(normalized);
      setHasMore(normalized.length === pageSize);

      if (!activeId && normalized.length > 0) {
        setActiveId(normalized[0].inquiry_id);
      }
    } catch (e: any) {
      console.error('Failed to load inquiries', e);
      setError('Unable to load inquiries.');
      setTickets([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, useAdvancedFallbacks, activeId]);

  useEffect(() => {
    void loadInquiries();
  }, [loadInquiries]);

  useEffect(() => {
    const channel = supabase
      .channel('inquiries-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inquiries' },
        () => {
          void loadInquiries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadInquiries]);

  const active = useMemo(
    () => tickets.find(t => t.inquiry_id === activeId) || null,
    [tickets, activeId]
  );

  return {
    tickets,
    active,
    activeId,
    setActiveId,
    loading,
    error,
    hasMore,
    reload: loadInquiries,
  };
}
