import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';
import {
  withErrorHandling,
  ErrorMessages,
} from '@features/chat/helpers/errorHandling';

const ORDER_URL_REGEX = /supabase:\/\/order-uploads\/[^\s,"')\]]+/gi;

export async function displayOrderUploadsAdmin(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  return withErrorHandling(
    'display_order_uploads_admin',
    async () => {
      const { actionNode, context } = params;
      const config = (actionNode.action_config as any) || {};
      const sessionKey = config.conversation_id_key || 'session_id';
      let sourceSessionId = String(context[sessionKey] || '').trim();

      if (!sourceSessionId) {
        return {
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: 'No session found for fetching uploaded images.',
              ts: Date.now(),
            },
          ],
        };
      }

      // Fetch decrypted chat messages via RPC
      const { data: allMessages } = await supabase.rpc(
        'api_fetch_chat_messages_v2',
        {
          p_session_id: sourceSessionId,
        }
      );

      const texts: string[] = Array.isArray(allMessages)
        ? (allMessages as any[])
            .map(m => String((m as any).message_text || ''))
            .filter(Boolean)
        : [];

      const urls = new Set<string>();
      for (const t of texts) {
        const matches = t.match(ORDER_URL_REGEX);
        if (matches && matches.length > 0) {
          matches.forEach(u => urls.add(u));
        }
      }

      const urlList = Array.from(urls);
      const text =
        urlList.length > 0
          ? ['Customer Uploaded Images:', '', ...urlList].join('\n')
          : 'No customer-uploaded images found for this request.';

      return {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'printy',
            text,
            ts: Date.now(),
          },
        ],
      };
    },
    ErrorMessages.GENERIC
  );
}
