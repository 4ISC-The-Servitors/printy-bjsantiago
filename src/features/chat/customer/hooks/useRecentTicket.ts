/**
 * useRecentTicket
 * Fetches the latest inquiry/ticket for the current user and shapes minimal card data.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';

export interface RecentTicketData {
  id: string;
  subject: string;
  status: string;
  updatedAt: number;
}

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
        const { data, error } = await supabase
          .from('inquiries')
          .select('inquiry_id, inquiry_message, inquiry_status, received_at')
          .eq('customer_id', user.id)
          .order('received_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        if (data) {
          setData({
            id: data.inquiry_id,
            subject: data.inquiry_message || '(no subject)',
            status: data.inquiry_status || 'unknown',
            updatedAt: new Date(data.received_at).getTime(),
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
