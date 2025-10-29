/**
 * useTicketImageUpload
 * Specialized hook for handling ticket image uploads in customer chat
 * Extends the basic file attachment functionality for ticket conversations
 */

import { useCallback } from 'react';
import { supabase } from '@lib/supabase';
import { uploadTicketImage } from '@shared/utils/uploadTicketImage';

export interface UseTicketImageUploadResult {
  handleTicketImageUpload: (
    files: FileList,
    inquiryId: string,
    onSuccess?: (url: string) => void,
    onError?: (error: string) => void,
    sessionId?: string
  ) => Promise<void>;
}

/**
 * Hook for handling ticket image uploads
 */
export function useTicketImageUpload(): UseTicketImageUploadResult {
  const handleTicketImageUpload = useCallback(
    async (
      files: FileList,
      inquiryId: string,
      onSuccess?: (url: string) => void,
      onError?: (error: string) => void,
      sessionId?: string
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
          onError?.('You must be logged in to upload ticket images');
          return;
        }

        // Upload file to Supabase Storage
        // Pass sessionId for new inquiries where inquiryId is not available yet
        const uploadResult = await uploadTicketImage(file, inquiryId, user.id, sessionId);

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

