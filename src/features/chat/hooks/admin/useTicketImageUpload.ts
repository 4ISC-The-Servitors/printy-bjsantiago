/**
 * useTicketImageUpload
 * Specialized hook for handling ticket image uploads in admin chat
 * Similar to customer hook but may have admin-specific logic in future
 */

import { useCallback } from 'react';
import { uploadTicketImages } from '@shared/utils/uploadTicketImages';
import { getAdminUserId } from '@features/chat/utils/admin/getAdminUserId';

export interface UseTicketImageUploadResult {
  handleTicketImageUpload: (
    files: FileList,
    inquiryId: string,
    customerId: string,
    onSuccess?: (urls: string[]) => void,
    onError?: (errors: string[]) => void,
    onProgress?: (value: number) => void
  ) => Promise<void>;
}

/**
 * Hook for handling ticket image uploads (admin version)
 * Admin can upload to any customer's ticket
 */
export function useTicketImageUpload(): UseTicketImageUploadResult {
  const handleTicketImageUpload = useCallback(
    async (
      files: FileList,
      inquiryId: string,
      customerId: string,
      onSuccess?: (urls: string[]) => void,
      onError?: (errors: string[]) => void,
      onProgress?: (value: number) => void
    ) => {
      const filesArray = Array.from(files || []);
      if (filesArray.length === 0) {
        onError?.(['No file selected']);
        return;
      }

      try {
        // Verify admin is authenticated
        const adminId = await getAdminUserId();
        if (!adminId) {
          onError?.(['You must be logged in as admin to upload ticket images']);
          return;
        }

        // Upload file to Supabase Storage using customerId for folder structure
        // This ensures proper RLS policies while allowing admin to upload
        const result = await uploadTicketImages(
          filesArray,
          inquiryId,
          customerId,
          undefined,
          onProgress
        );
        if (result.errors.length > 0) {
          onError?.(result.errors);
          if (result.urls.length > 0) {
            onSuccess?.(result.urls);
          }
          return;
        }
        onSuccess?.(result.urls);
      } catch (error) {
        console.error('Error uploading ticket image:', error);
        onError?.([
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        ]);
      }
    },
    []
  );

  return {
    handleTicketImageUpload,
  };
}

export default useTicketImageUpload;
