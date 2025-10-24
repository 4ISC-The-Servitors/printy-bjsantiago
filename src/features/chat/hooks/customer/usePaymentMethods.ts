/**
 * usePaymentMethods
 * Hook to fetch payment methods from the database
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@lib/supabase';

export interface PaymentMethod {
  method_id: string;
  method_type: 'bank_transfer' | 'qrph';
  image_url: string;
  label: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface UsePaymentMethodsResult {
  paymentMethods: PaymentMethod[];
  bankTransferMethods: PaymentMethod[];
  qrphMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage payment methods
 */
export function usePaymentMethods(): UsePaymentMethodsResult {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error fetching payment methods:', fetchError);
        setError(fetchError.message);
        return;
      }

      setPaymentMethods(data || []);
    } catch (err) {
      console.error('Unexpected error fetching payment methods:', err);
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  // Filter methods by type
  const bankTransferMethods = paymentMethods.filter(
    method => method.method_type === 'bank_transfer'
  );

  const qrphMethods = paymentMethods.filter(
    method => method.method_type === 'qrph'
  );

  return {
    paymentMethods,
    bankTransferMethods,
    qrphMethods,
    loading,
    error,
    refetch: fetchPaymentMethods,
  };
}

/**
 * Hook to fetch payment methods with admin management capabilities
 */
export function useAdminPaymentMethods(): UsePaymentMethodsResult & {
  addPaymentMethod: (
    method: Omit<PaymentMethod, 'method_id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  updatePaymentMethod: (
    methodId: string,
    updates: Partial<PaymentMethod>
  ) => Promise<void>;
  deletePaymentMethod: (methodId: string) => Promise<void>;
} {
  const baseResult = usePaymentMethods();
  const [loading, setLoading] = useState(false);

  const addPaymentMethod = useCallback(
    async (
      method: Omit<PaymentMethod, 'method_id' | 'created_at' | 'updated_at'>
    ) => {
      try {
        setLoading(true);

        const { error } = await supabase
          .from('payment_methods')
          .insert([method]);

        if (error) {
          console.error('Error adding payment method:', error);
          throw error;
        }

        // Refetch to get updated list
        await baseResult.refetch();
      } catch (err) {
        console.error('Error adding payment method:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseResult]
  );

  const updatePaymentMethod = useCallback(
    async (methodId: string, updates: Partial<PaymentMethod>) => {
      try {
        setLoading(true);

        const { error } = await supabase
          .from('payment_methods')
          .update(updates)
          .eq('method_id', methodId);

        if (error) {
          console.error('Error updating payment method:', error);
          throw error;
        }

        // Refetch to get updated list
        await baseResult.refetch();
      } catch (err) {
        console.error('Error updating payment method:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseResult]
  );

  const deletePaymentMethod = useCallback(
    async (methodId: string) => {
      try {
        setLoading(true);

        const { error } = await supabase
          .from('payment_methods')
          .delete()
          .eq('method_id', methodId);

        if (error) {
          console.error('Error deleting payment method:', error);
          throw error;
        }

        // Refetch to get updated list
        await baseResult.refetch();
      } catch (err) {
        console.error('Error deleting payment method:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseResult]
  );

  return {
    ...baseResult,
    loading: baseResult.loading || loading,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  };
}

export default usePaymentMethods;
