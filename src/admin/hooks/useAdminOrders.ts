/**
 * useAdminOrders
 * Fetches all orders from orders table for admin view
 * Similar to customer useRecentOrder but fetches all orders with pagination
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@lib/supabase';

export interface AdminOrderData {
  order_id: string;
  display_id?: string;
  customer_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  currency: string;
  order_specs: any;
  payment_proof?: string;
  payment_verified_at?: string;
  customer?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface AdminOrderRow {
  id: string;
  order_id: string; // The actual UUID for database operations
  display_id?: string;
  customer_id: string;
  customer_name: string;
  customer_type: string;
  product_name: string;
  total_amount: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  updated_by?: string | null;
  // Legacy fields for backward compatibility
  customer: string;
  total: string;
  date: string;
  proofOfPaymentUrl?: string;
  proofUploadedAt?: string;
}

const DEFAULT_PAGE_SIZE = 25;

export function useAdminOrders(pageSize: number = DEFAULT_PAGE_SIZE) {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const loadedPagesRef = useRef<Set<number>>(new Set());

  const fetchPage = useCallback(
    async (page: number, replaceExisting: boolean = page === 1) => {
      const from = (page - 1) * pageSize;

      if (replaceExisting) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const { data, error, count } = await supabase
          .from('orders')
          .select(
            `
          order_id,
          display_id,
          customer_id,
          status,
          created_at,
          updated_at,
          updated_by,
          completed_at,
          total_amount,
          order_specs,
          payment_proof,
          payment_verified_at,
          customer:customer_id(first_name, last_name, customer_type)
        `,
            { count: 'exact' }
          )
          .order('updated_at', { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) {
          console.error('[useAdminOrders] Error fetching orders:', error);
          setError(error.message);
          return;
        }

        const normalized: AdminOrderRow[] = (data || []).map((order: any) => {
          // Handle customer data - it might be an array or object
          const customerData = Array.isArray(order.customer)
            ? order.customer[0]
            : order.customer;
          const customerName = customerData
            ? `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() ||
              'Unknown Customer'
            : 'Unknown Customer';

          // Extract product name from order_specs JSONB
          const productName =
            order.order_specs?.product_name || 'Unnamed Order';

          // Use peso sign as default currency
          const currencySymbol = '₱';

          return {
            id: order.order_id, // Use actual UUID for database operations
            order_id: order.order_id, // Store the actual UUID separately
            display_id: order.display_id,
            customer_id: order.customer_id,
            customer_name: customerName,
            customer_type: customerData?.customer_type || 'regular',
            product_name: productName,
            total_amount: `${currencySymbol}${Number(order.total_amount).toLocaleString()}`,
            status: order.status,
            created_at: order.created_at,
            updated_at: order.updated_at,
            updated_by: order.updated_by || null,
            completed_at: order.completed_at,
            // Legacy fields for backward compatibility
            customer: customerName,
            total: `₱${Number(order.total_amount).toLocaleString()}`,
            date: new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
            proofOfPaymentUrl: order.payment_proof || undefined,
            proofUploadedAt: order.payment_verified_at
              ? new Date(order.payment_verified_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : undefined,
          };
        });

        setTotalCount(count || 0);
        loadedPagesRef.current.add(page);

        setOrders(prev => {
          if (replaceExisting) {
            // Sort by updated_at descending (latest first)
            return normalized.sort(
              (a, b) =>
                new Date(b.updated_at || 0).getTime() -
                new Date(a.updated_at || 0).getTime()
            );
          }
          const merged = [...prev];
          for (const row of normalized) {
            const i = merged.findIndex(o => o.order_id === row.order_id);
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
      } catch (e: any) {
        console.error('[useAdminOrders] Unexpected error:', e);
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

  // Load orders on mount and when dependencies change
  useEffect(() => {
    loadedPagesRef.current.clear();
    void fetchPage(1, true);
    setCurrentPage(1);
  }, [fetchPage]);

  // Real-time subscription for orders table changes with efficient local state merging
  useEffect(() => {
    const channel = supabase
      .channel('orders-changes-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        async payload => {
          const orderId =
            (payload.new as any)?.order_id || (payload.old as any)?.order_id;
          if (!orderId) return;

          // Handle DELETE: remove from local state
          if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.order_id !== orderId));
            setTotalCount(prev => Math.max(0, prev - 1));
            return;
          }

          // Handle INSERT/UPDATE: fetch single row with joins and merge into state
          try {
            const { data, error } = await supabase
              .from('orders')
              .select(
                `
                order_id,
                display_id,
                customer_id,
                status,
                created_at,
                updated_at,
              updated_by,
                completed_at,
                total_amount,
                order_specs,
                payment_proof,
                payment_verified_at,
                customer:customer_id(first_name, last_name, customer_type)
              `
              )
              .eq('order_id', orderId)
              .single();

            if (error || !data) {
              console.error(
                '[useAdminOrders] Error fetching updated order:',
                error
              );
              return;
            }

            // Normalize the fetched order
            const customerData = Array.isArray(data.customer)
              ? data.customer[0]
              : data.customer;
            const customerName = customerData
              ? `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() ||
                'Unknown Customer'
              : 'Unknown Customer';
            const productName =
              data.order_specs?.product_name || 'Unnamed Order';
            const currencySymbol = '₱';

            const normalizedOrder: AdminOrderRow = {
              id: data.order_id,
              order_id: data.order_id,
              display_id: data.display_id,
              customer_id: data.customer_id,
              customer_name: customerName,
              customer_type: customerData?.customer_type || 'regular',
              product_name: productName,
              total_amount: `${currencySymbol}${Number(data.total_amount).toLocaleString()}`,
              status: data.status,
              created_at: data.created_at,
              updated_at: data.updated_at,
              updated_by: data.updated_by || null,
              completed_at: data.completed_at,
              customer: customerName,
              total: `₱${Number(data.total_amount).toLocaleString()}`,
              date: new Date(data.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }),
              proofOfPaymentUrl: data.payment_proof || undefined,
              proofUploadedAt: data.payment_verified_at
                ? new Date(data.payment_verified_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : undefined,
            };

            // Merge into state
            setOrders(prev => {
              const existingIndex = prev.findIndex(o => o.order_id === orderId);
              if (existingIndex >= 0) {
                // Update existing order
                const updated = [...prev];
                updated[existingIndex] = normalizedOrder;
                // Sort by updated_at descending (latest first)
                return updated.sort(
                  (a, b) =>
                    new Date(b.updated_at || 0).getTime() -
                    new Date(a.updated_at || 0).getTime()
                );
              } else {
                // Insert new order and sort by updated_at descending (latest first)
                return [normalizedOrder, ...prev].sort(
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
              '[useAdminOrders] Error processing realtime update:',
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

  const refresh = useCallback(() => {
    loadedPagesRef.current.clear();
    void fetchPage(1, true);
    setCurrentPage(1);
  }, [fetchPage]);

  const hasMore = totalCount > orders.length;
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    const nextPage = currentPage + 1;
    if (loadedPagesRef.current.has(nextPage)) return;
    await fetchPage(nextPage, false);
    setCurrentPage(nextPage);
  }, [currentPage, fetchPage, hasMore, loadingMore]);

  const loadAll = useCallback(async () => {
    if (loadingAll || !hasMore) return;
    setLoadingAll(true);
    try {
      const totalPages = Math.ceil(totalCount / pageSize);
      for (let p = currentPage + 1; p <= totalPages; p += 1) {
        if (loadedPagesRef.current.has(p)) continue;
        await fetchPage(p, false);
      }
    } finally {
      setLoadingAll(false);
    }
  }, [currentPage, fetchPage, hasMore, loadingAll, pageSize, totalCount]);

  return {
    orders,
    loading,
    error,
    totalCount,
    hasMore,
    loadMore,
    loadAll,
    loadingMore,
    loadingAll,
    refresh,
  };
}

export default useAdminOrders;
