/**
 * usePaymentProofUpload
 * Specialized hook for handling payment proof uploads in customer chat
 * Extends the basic file attachment functionality with order status updates
 */

import { useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { uploadPaymentProof } from '@shared/utils/uploadPaymentProof';

export interface UsePaymentProofUploadResult {
  handlePaymentProofUpload: (
    files: FileList,
    orderId: string,
    onSuccess?: (url: string) => void,
    onError?: (error: string) => void
  ) => Promise<void>;
}

/**
 * Hook for handling payment proof uploads
 */
export function usePaymentProofUpload(): UsePaymentProofUploadResult {
  const handlePaymentProofUpload = useCallback(
    async (
      files: FileList,
      orderId: string,
      onSuccess?: (url: string) => void,
      onError?: (error: string) => void
    ) => {
      const file = files?.[0];
      if (!file) {
        onError?.('No file selected');
        return;
      }

      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          onError?.('You must be logged in to upload payment proofs');
          return;
        }

        // Upload file to Supabase Storage
        const uploadResult = await uploadPaymentProof(file, orderId, user.id);

        if (uploadResult.error) {
          onError?.(uploadResult.error);
          return;
        }

        // Update order with payment proof URL and timestamp

        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_proof: uploadResult.url,
            payment_proof_uploaded_at: new Date().toISOString(),
            status: 'verifying_payment', // Update status to verifying_payment
            updated_by: user.id, // Track that customer uploaded payment proof
          })
          .eq('order_id', orderId) // Use order_id since useRecentOrder returns UUID
          .eq('customer_id', user.id);

        if (updateError) {
          console.error(
            'Error updating order with payment proof:',
            updateError
          );
          onError?.('Failed to update order status. Please try again.');
          return;
        }


        // Success
        onSuccess?.(uploadResult.url);
      } catch (error) {
        console.error('Error uploading payment proof:', error);
        onError?.(
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred'
        );
      }
    },
    []
  );

  return {
    handlePaymentProofUpload,
  };
}

export default usePaymentProofUpload;
