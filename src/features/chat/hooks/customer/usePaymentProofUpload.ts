/**
 * usePaymentProofUpload
 * Hook for handling payment proof file uploads in customer chat
 * Only handles file upload to storage - order updates are handled by process_payment_proof_upload action
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
 * Hook for handling payment proof file uploads
 * Uploads file to storage and returns the URL to be processed by the flow action
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

        // Return the URL - order update will be handled by process_payment_proof_upload action
        // This prevents duplicate notifications from firing twice
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
