/**
 * useRecentOrder
 * Fetches the latest order for the current user and shapes minimal card data.
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@lib/supabase';

import { formatCurrency } from '@shared/utils/priceFormatter';
import type { RecentOrder } from '@shared/types/customer';

export type RecentOrderData = RecentOrder;

export function useRecentOrder() {
  const [data, setData] = useState<RecentOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const loadRecentOrder = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          order_id,
          display_id,
          status,
          created_at,
          updated_at,
          payment_verified_at,
          completed_at,
          total_amount,
          order_specs
        `
        )
        .eq('customer_id', userId)
        .order('updated_at', { ascending: false })
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
          total = formatCurrency(Number(data.total_amount));
        }
        setData({
          id: data.order_id,
          displayId: data.display_id,
          title: data.order_specs?.product_name || 'Order',
          status: data.status || 'unknown',
          createdAt: new Date(data.created_at).getTime(),
          updatedAt: new Date(data.updated_at).getTime(),
          paymentVerifiedAt: data.payment_verified_at
            ? new Date(data.payment_verified_at).getTime()
            : undefined,
          completedAt: data.completed_at
            ? new Date(data.completed_at).getTime()
            : undefined,
          total,
        });
      } else {
        setData(null);
      }
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
        setUserId(user.id);
      } catch (e: any) {
        setError(e?.message || 'Unknown error');
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (userId) {
      loadRecentOrder();
    }
  }, [userId, loadRecentOrder]);

  // Add real-time subscription for orders table changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('customer-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${userId}`,
        },
        () => {
          void loadRecentOrder();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadRecentOrder]);

  return { data, loading, error } as const;
}

export default useRecentOrder;
