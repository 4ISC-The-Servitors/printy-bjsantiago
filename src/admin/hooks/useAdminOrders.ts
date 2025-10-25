/**
 * useAdminOrders
 * Fetches all orders from orders table for admin view
 * Similar to customer useRecentOrder but fetches all orders with pagination
 */
import { useEffect, useState, useCallback } from 'react';
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
  customer_name: string;
  customer_type: string;
  product_name: string;
  total_amount: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  // Legacy fields for backward compatibility
  customer: string;
  total: string;
  date: string;
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
        .from('orders')
        .select(
          `
          order_id,
          display_id,
          customer_id,
          status,
          created_at,
          updated_at,
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


      // Transform the data to match the expected interface
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
        const productName = order.order_specs?.product_name || 'Unnamed Order';

        // Use peso sign as default currency
        const currencySymbol = '₱';

        return {
          id: order.order_id, // Use actual UUID for database operations
          order_id: order.order_id, // Store the actual UUID separately
          display_id: order.display_id,
          customer_name: customerName,
          customer_type: customerData?.customer_type || 'regular',
          product_name: productName,
          total_amount: `${currencySymbol}${Number(order.total_amount).toLocaleString()}`,
          status: order.status,
          created_at: order.created_at,
          updated_at: order.updated_at,
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

  // Add real-time subscription for orders table changes
  useEffect(() => {
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          void loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
