import { useCallback, useState } from 'react';
import { quoteActions } from '../../features/api/quoteApi';

type ShowSpecResult = {
  quote_id: string;
  status: string;
  spec: Record<string, unknown>;
  quoted_price?: number;
};

export function useQuoteActions(supabaseUrl?: string, accessToken?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async (args: Parameters<typeof quoteActions>[0]) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await quoteActions({ ...args, supabaseUrl, accessToken });
        return res;
      } catch (e: any) {
        setError(e?.message || 'Request failed');
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [supabaseUrl, accessToken]
  );

  const showSpecs = useCallback(
    async (params: { inquiry_id?: string; quote_id?: string }) => {
      return (await call({
        action: 'show-specs',
        ...params,
      })) as ShowSpecResult;
    },
    [call]
  );

  const editSpecs = useCallback(
    async (params: {
      quote_id?: string;
      inquiry_id?: string;
      spec_patch: Record<string, unknown>;
    }) => {
      return await call({ action: 'edit-specs', ...params });
    },
    [call]
  );

  const proposeQuote = useCallback(
    async (params: {
      quote_id: string;
      quoted_price: number;
      notes?: string;
    }) => {
      return await call({ action: 'propose-quote', ...params });
    },
    [call]
  );

  const sendForApproval = useCallback(
    async (params: { quote_id: string }) => {
      return await call({ action: 'send-for-approval', ...params });
    },
    [call]
  );

  const placeOrder = useCallback(
    async (params: { quote_id: string; valued: boolean }) => {
      return await call({ action: 'place-order', ...params });
    },
    [call]
  );

  return {
    isLoading,
    error,
    showSpecs,
    editSpecs,
    proposeQuote,
    sendForApproval,
    placeOrder,
  };
}
