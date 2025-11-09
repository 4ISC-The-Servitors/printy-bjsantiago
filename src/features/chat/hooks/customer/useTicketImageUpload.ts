/**
 * useTicketImageUpload
 * Specialized hook for handling ticket file uploads (images and PDFs) in customer chat
 * Extends the basic file attachment functionality for ticket conversations
 */

import { useCallback } from 'react';
import { supabase } from '@lib/supabase';
import { uploadTicketImages } from '@shared/utils/uploadTicketImages';

export interface UseTicketImageUploadResult {
  handleTicketImageUpload: (
    files: FileList,
    inquiryId: string,
    onSuccess?: (urls: string[]) => void,
    onError?: (errors: string[]) => void,
    sessionId?: string,
    onProgress?: (value: number) => void
  ) => Promise<void>;
}

/**
 * Hook for handling ticket file uploads (images and PDFs)
 */
export function useTicketImageUpload(): UseTicketImageUploadResult {
  const handleTicketImageUpload = useCallback(
    async (
      files: FileList,
      inquiryId: string,
      onSuccess?: (urls: string[]) => void,
      onError?: (errors: string[]) => void,
      sessionId?: string,
      onProgress?: (value: number) => void
    ) => {
      const filesArray = Array.from(files || []);
      if (filesArray.length === 0) {
        onError?.(['No files selected']);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          onError?.(['You must be logged in to upload files']);
          return;
        }

        const result = await uploadTicketImages(
          filesArray,
          inquiryId,
          user.id,
          sessionId,
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
        console.error('Error uploading files:', error);
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
