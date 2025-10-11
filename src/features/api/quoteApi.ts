// Quote API client: calls Edge Functions chat-quote and quote-actions

export type QuoteStatus = 'draft' | 'proposed' | 'agreed' | 'rejected';

export async function chatQuote(params: {
  supabaseUrl?: string; // optional override (defaults to environment variable)
  inquiry_id?: string;
  quote_id?: string;
  customer_id?: string;
  preferred_language?: 'tl' | 'en';
  messages: Array<{ role: 'customer' | 'admin'; text: string }>;
  accessToken?: string; // optional auth bearer
}) {
  // Use deployed Supabase Edge Function URL
  const baseUrl = params.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
  const url = `${baseUrl}/functions/v1/chat-quote`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(params.accessToken
        ? { Authorization: `Bearer ${params.accessToken}` }
        : {}),
    },
    body: JSON.stringify({
      inquiry_id: params.inquiry_id,
      quote_id: params.quote_id,
      customer_id: params.customer_id,
      preferred_language: params.preferred_language,
      messages: params.messages,
    }),
  });
  if (!res.ok)
    throw new Error(`chat-quote error ${res.status}: ${await res.text()}`);
  return (await res.json()) as {
    assistant: { text: string };
    spec: Record<string, unknown>;
    quote_id: string;
    status: QuoteStatus;
  };
}

export async function quoteActions(params: {
  supabaseUrl?: string;
  action:
    | 'show-specs'
    | 'edit-specs'
    | 'propose-quote'
    | 'send-for-approval'
    | 'place-order';
  inquiry_id?: string;
  quote_id?: string;
  spec_patch?: Record<string, unknown>;
  quoted_price?: number;
  notes?: string;
  valued?: boolean;
  accessToken?: string;
}) {
  // Use deployed Supabase Edge Function URL
  const baseUrl = params.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
  const url = `${baseUrl}/functions/v1/quote-actions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(params.accessToken
        ? { Authorization: `Bearer ${params.accessToken}` }
        : {}),
    },
    body: JSON.stringify({
      action: params.action,
      inquiry_id: params.inquiry_id,
      quote_id: params.quote_id,
      spec_patch: params.spec_patch,
      quoted_price: params.quoted_price,
      notes: params.notes,
      valued: params.valued,
    }),
  });
  if (!res.ok)
    throw new Error(`quote-actions error ${res.status}: ${await res.text()}`);
  return await res.json();
}
