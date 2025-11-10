/**
 * useRecentOrder
 * Fetches the latest order for the current user using admin real-time patterns.
 */
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@lib/supabase';
import { formatCurrency } from '@shared/utils/priceFormatter';
import type { RecentOrder } from '@shared/types/customer';

export type RecentOrderData = RecentOrder;

export function useRecentOrder() {
  const [data, setData] = useState<RecentOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const dataRef = useRef<RecentOrderData | null>(null);

  // Normalization function
  const normalizeOrder = (rawData: any): RecentOrderData => {
    let total: string | undefined = undefined;
    if (rawData.total_amount) {
      total = formatCurrency(Number(rawData.total_amount));
    }

    return {
      id: rawData.order_id,
      displayId: rawData.display_id,
      title: rawData.order_specs?.product_name || 'Order',
      status: rawData.status || 'unknown',
      createdAt: new Date(rawData.created_at).getTime(),
      updatedAt: new Date(rawData.updated_at).getTime(),
      paymentVerifiedAt: rawData.payment_verified_at
        ? new Date(rawData.payment_verified_at).getTime()
        : undefined,
      completedAt: rawData.completed_at
        ? new Date(rawData.completed_at).getTime()
        : undefined,
      total,
    };
  };

  // Fetch initial recent order and set up user ID
  useEffect(() => {
    const initialize = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);

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
          .eq('customer_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        if (data) {
          const orderData = normalizeOrder(data);
          setData(orderData);
          dataRef.current = orderData;
        } else {
          dataRef.current = null;
        }
      } catch (e: any) {
        setError(e?.message || 'Unknown error');
        dataRef.current = null;
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Update ref whenever data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Real-time subscription for orders changes using admin pattern
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('orders-customer-recent')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${userId}`,
        },
        async payload => {
          const orderId =
            (payload.new as any)?.order_id || (payload.old as any)?.order_id;
          if (!orderId) return;

          try {
            // Handle DELETE: remove from local state or refetch
            if (payload.eventType === 'DELETE') {
              if (dataRef.current?.id === orderId) {
                // Refetch latest order
                const { data: latestData, error: latestError } = await supabase
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

                if (!latestError && latestData) {
                  const orderData = normalizeOrder(latestData);
                  setData(orderData);
                  dataRef.current = orderData;
                } else {
                  setData(null);
                  dataRef.current = null;
                }
              }
              return;
            }

            // Handle INSERT/UPDATE: fetch single row with joins and merge into state
            const { data: fullOrder, error: fetchError } = await supabase
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
              .eq('order_id', orderId)
              .single();

            if (fetchError || !fullOrder) {
              console.error(
                '[useRecentOrder] Error fetching updated order:',
                fetchError
              );
              return;
            }

            const normalizedOrder = normalizeOrder(fullOrder);
            const currentOrder = dataRef.current;

            // Determine if this should replace the current order
            const shouldUpdate =
              !currentOrder ||
              currentOrder.id === orderId ||
              normalizedOrder.updatedAt > currentOrder.updatedAt;

            if (shouldUpdate) {
              setData(normalizedOrder);
              dataRef.current = normalizedOrder;
            }
          } catch (e) {
            console.error(
              '[useRecentOrder] Error processing realtime update:',
              e
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { data, loading, error } as const;
}

export default useRecentOrder;
