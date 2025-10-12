/**
 * useRecentOrder
 * Fetches the latest order for the current user and shapes minimal card data.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export interface RecentOrderData {
  id: string;
  title: string;
  status: string;
  updatedAt: number;
  total?: string;
}

export function useRecentOrder() {
  const [data, setData] = useState<RecentOrderData | null>(null);
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
          .from('orders_duplicate')
          .select(
            `
            order_id,
            display_id,
            status,
            created_at,
            total_amount,
            order_specs
          `
          )
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        if (data) {
          let total: string | undefined = undefined;
          if (data.total_amount) {
            total = `₱${Number(data.total_amount)}`;
          }
          setData({
            id: data.order_id, // Use actual order_id for database queries
            displayId: data.display_id, // Store display_id separately for display
            title: data.order_specs?.product_name || 'Order',
            status: data.status || 'unknown',
            updatedAt: new Date(data.created_at).getTime(),
            total,
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

export default useRecentOrder;
