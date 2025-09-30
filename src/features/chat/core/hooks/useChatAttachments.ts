/**
 * useChatAttachments
 * Wraps URL.createObjectURL and delegates the produced URL/string to your send handler.
 * Shared across customer/admin surfaces.
 */
import { useCallback } from 'react';

export function useChatAttachments(onSend: (text: string) => void) {
  const handleAttachFiles = useCallback(
    (files: FileList) => {
      const f = files?.[0];
      if (f) {
        const url = URL.createObjectURL(f);
        onSend(url);
      }
    },
    [onSend]
  );

  return { handleAttachFiles } as const;
}

export default useChatAttachments;
