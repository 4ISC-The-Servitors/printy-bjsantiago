/**
 * useRecentOrder
 * Fetches the latest order for the current user and shapes minimal card data.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';

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
          .from('orders')
          .select(
            `
            order_id,
            order_status,
            order_datetime,
            service_id,
            quotes:quotes(initial_price, negotiated_price)
          `
          )
          .eq('customer_id', user.id)
          .order('order_datetime', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        if (data) {
          let total: string | undefined = undefined;
          if (data.quotes && data.quotes.length > 0) {
            const quote = data.quotes[0];
            const quotedPrice = quote.negotiated_price || quote.initial_price;
            if (quotedPrice) total = `₱${quotedPrice.toFixed(2)}`;
          }
          setData({
            id: data.order_id,
            title: data.service_id || 'Unknown Service',
            status: data.order_status || 'unknown',
            updatedAt: new Date(data.order_datetime).getTime(),
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
