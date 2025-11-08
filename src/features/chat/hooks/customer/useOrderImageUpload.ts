import { useCallback } from 'react';
import { supabase } from '@lib/supabase';
import { uploadOrderImages } from '@shared/utils/uploadOrderImages';

export interface UseOrderImageUploadResult {
  handleOrderImageUpload: (
    files: FileList,
    orderId: string | null,
    onSuccess?: (urls: string[]) => void,
    onError?: (errors: string[]) => void,
    onProgress?: (value: number) => void
  ) => Promise<void>;
}

export function useOrderImageUpload(): UseOrderImageUploadResult {
  const handleOrderImageUpload = useCallback(
    async (
      files: FileList,
      orderId: string | null,
      onSuccess?: (urls: string[]) => void,
      onError?: (errors: string[]) => void,
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
          onError?.(['You must be logged in to upload order images']);
          return;
        }

        const result = await uploadOrderImages(
          filesArray,
          orderId || '',
          user.id,
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
        onError?.([
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        ]);
      }
    },
    []
  );

  return { handleOrderImageUpload };
}

export default useOrderImageUpload;
