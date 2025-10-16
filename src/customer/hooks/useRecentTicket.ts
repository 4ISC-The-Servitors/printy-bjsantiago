/**
 * useRecentTicket
 * Fetches the latest inquiry/ticket for the current user and shapes minimal card data.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

import type { RecentTicket } from '../../types/customer';

export type RecentTicketData = RecentTicket;

export function useRecentTicket() {
  const [data, setData] = useState<RecentTicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.rpc('api_inquiries_for_user', {
          p_limit: 1,
          p_offset: 0,
        });
        const row = ((data as any[]) || [])[0];
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        if (row) {
          const receivedAt = new Date(row.received_at).getTime();
          setData({
            id: row.inquiry_id,
            displayId: row.display_id || row.inquiry_id.slice(0, 8).toUpperCase(),
            subject: row.inquiry_message || '(no subject)',
            status: row.inquiry_status || 'unknown',
            createdAt: receivedAt,
            updatedAt: receivedAt, // Using received_at as updatedAt since it's the only date we have
            resolvedAt: row.inquiry_status === 'resolved' ? receivedAt : undefined
          });
        }
      } catch (e: any) {
        setError(e?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading, error } as const;
}

export default useRecentTicket;
