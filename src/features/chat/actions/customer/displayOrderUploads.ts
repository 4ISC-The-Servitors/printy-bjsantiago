import { supabase } from '@lib/supabase';
import type {
  ActionExecutionParams,
  ActionExecutionResult,
} from '@features/chat/types';

const ORDER_URL_REGEX = /supabase:\/\/order-uploads\/[^\s,"')\]]+/gi;

export async function displayOrderUploads(
  params: ActionExecutionParams
): Promise<ActionExecutionResult> {
  const { actionNode, context } = params;
  const config = (actionNode.action_config as any) || {};
  const sessionKey = config.conversation_id_key || 'conversation_id';
  let sourceSessionId = String(context[sessionKey] || '').trim();

  // If a quote_id was passed, map to its session_id (mirror admin behavior)
  if (sourceSessionId && sourceSessionId.length > 30) {
    const { data: quoteData } = await supabase
      .from('quotes')
      .select('session_id')
      .eq('quote_id', sourceSessionId)
      .single();
    if (quoteData?.session_id) sourceSessionId = quoteData.session_id;
  }

  if (!sourceSessionId) {
    return {
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'No images available for this request.',
          ts: Date.now(),
        },
      ],
    };
  }

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
      : 'No uploaded images found for this request.';

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
}
