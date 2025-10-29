/**
 * useTicketImageUpload
 * Specialized hook for handling ticket image uploads in admin chat
 * Similar to customer hook but may have admin-specific logic in future
 */

import { useCallback } from 'react';
import { uploadTicketImage } from '@shared/utils/uploadTicketImage';
import { getAdminUserId } from '@features/chat/utils/admin/getAdminUserId';

export interface UseTicketImageUploadResult {
  handleTicketImageUpload: (
    files: FileList,
    inquiryId: string,
    customerId: string, // Admin needs to specify which customer's ticket
    onSuccess?: (url: string) => void,
    onError?: (error: string) => void
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
      onSuccess?: (url: string) => void,
      onError?: (error: string) => void
    ) => {
      const file = files?.[0];
      if (!file) {
        onError?.('No file selected');
        return;
      }

      try {
        // Verify admin is authenticated
        const adminId = await getAdminUserId();
        if (!adminId) {
          onError?.('You must be logged in as admin to upload ticket images');
          return;
        }

        // Upload file to Supabase Storage using customerId for folder structure
        // This ensures proper RLS policies while allowing admin to upload
        const uploadResult = await uploadTicketImage(file, inquiryId, customerId);

        if (uploadResult.error) {
          onError?.(uploadResult.error);
          return;
        }

        // Success - return URL via callback
        onSuccess?.(uploadResult.url);
      } catch (error) {
        console.error('Error uploading ticket image:', error);
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
    handleTicketImageUpload,
  };
}

export default useTicketImageUpload;

