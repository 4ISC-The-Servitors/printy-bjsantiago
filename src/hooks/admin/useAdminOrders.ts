/**
 * useAdminOrders
 * Fetches all orders from orders_duplicate table for admin view
 * Similar to customer useRecentOrder but fetches all orders with pagination
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

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
  display_id?: string;
  customer: string;
  total: string;
  date: string;
  status: string;
  priority?: string;
  proofOfPaymentUrl?: string;
  proofUploadedAt?: string;
}

interface LoadOrdersOptions {
  page?: number;
  pageSize?: number;
}

export function useAdminOrders(options: LoadOrdersOptions = {}) {
  const { page = 1, pageSize = 10 } = options;
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const from = (page - 1) * pageSize;
      
      // Fetch orders with customer information
      const { data, error, count } = await supabase
        .from('orders_duplicate')
        .select(`
          order_id,
          display_id,
          customer_id,
          status,
          created_at,
          updated_at,
          total_amount,
          currency,
          order_specs,
          payment_proof,
          payment_verified_at,
          customer:customer_id(first_name, last_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('[useAdminOrders] Error fetching orders:', error);
        setError(error.message);
        return;
      }

      console.debug('[useAdminOrders] Fetched orders:', data?.length || 0);

      // Transform the data to match the expected interface
      const normalized: AdminOrderRow[] = (data || []).map((order: AdminOrderData) => ({
        id: order.display_id || order.order_id, // Prefer display_id
        display_id: order.display_id,
        customer: order.customer 
          ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || 'Unknown Customer'
          : 'Unknown Customer',
        total: `₱${Number(order.total_amount).toLocaleString()}`,
        date: new Date(order.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        status: order.status,
        proofOfPaymentUrl: order.payment_proof || undefined,
        proofUploadedAt: order.payment_verified_at 
          ? new Date(order.payment_verified_at).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : undefined,
      }));

      setOrders(normalized);
      setTotalCount(count || 0);
    } catch (e: any) {
      console.error('[useAdminOrders] Unexpected error:', e);
      setError(e?.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  // Load orders on mount and when dependencies change
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const refresh = useCallback(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    loading,
    error,
    totalCount,
    refresh,
  };
}

export default useAdminOrders;
