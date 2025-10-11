// Deno Edge Function: chat-quote
// Purpose: Consume recent ticket turns, call LLM to extract/merge a spec JSON, upsert into public.quotes
// Env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Edge default)
//   LLM_PROVIDER ("groq" | "ollama"), LLM_BASE_URL, LLM_MODEL, LLM_API_KEY (if provider requires)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type Spec = Record<string, unknown>;

interface ChatQuoteRequest {
  inquiry_id?: string;
  quote_id?: string;
  customer_id?: string; // optional; inferred from auth if omitted
  messages: Array<{ role: 'customer' | 'admin'; text: string }>; // last N turns
  preferred_language?: 'tl' | 'en';
}

interface ChatQuoteResponse {
  assistant: { text: string };
  spec: Spec;
  quote_id: string;
  status: 'draft' | 'proposed' | 'agreed' | 'rejected';
}

const BASE_URL = Deno.env.get('LLM_BASE_URL') || 'http://localhost:11434';
const MODEL = Deno.env.get('LLM_MODEL') || 'gpt-oss:20b-cloud';

async function callLLM(
  messages: { role: string; content: string }[],
  forceJson = true
): Promise<{ assistant: { text: string }; spec: Spec }> {
  // Ollama only
  const body: any = {
    model: MODEL,
    messages,
    stream: false,
    options: { temperature: 0.2 },
    ...(forceJson ? { format: 'json' } : {}),
  };

  console.log(
    `[chat-quote] Calling Ollama at ${BASE_URL}/api/chat with model: ${MODEL}`
  );

  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[chat-quote] Ollama error ${res.status}: ${errorText}`);
    throw new Error(`LLM error ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  console.log(`[chat-quote] Ollama response:`, data);

  const content = data?.message?.content || '{}';
  const parsed = JSON.parse(
    String(content)
      .replace(/```json|```/g, '')
      .trim() || '{}'
  );

  return {
    assistant: {
      text:
        parsed?.assistant?.text ||
        'I received your request and will process it.',
    },
    spec: parsed?.spec || {},
  };
}

function toSystem(preferred_language: 'tl' | 'en' | undefined) {
  return `You are Printy. Maintain a clean JSON spec from conversation. Language: ${preferred_language || 'tl'}.
- Do not invent prices. Unknown fields omitted.
- Arbitrary sizes allowed, keep units verbatim.
Return ONLY JSON: { "assistant": {"text": string}, "spec": { ... } }`;
}

function toMessages(
  system: string,
  turns: Array<{ role: 'customer' | 'admin'; text: string }>
) {
  const out: { role: string; content: string }[] = [
    { role: 'system', content: system },
  ];
  // limit to last 10 turns to control cost
  const last = turns.slice(-10);
  for (const t of last) {
    out.push({ role: 'user', content: `${t.role.toUpperCase()}: ${t.text}` });
  }
  return out;
}

async function upsertQuote(
  supabase: any,
  payload: {
    inquiry_id?: string;
    quote_id?: string;
    customer_id?: string;
    spec: Spec;
  }
) {
  const { inquiry_id, quote_id, customer_id, spec } = payload;

  async function tableExists(name: string) {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', name)
      .maybeSingle();
    return !error && !!data;
  }
  const useQuotesDup = await tableExists('quotes_duplicate');
  const useCustomerQuotes = await tableExists('customer_quotes');
  const QUOTES = useQuotesDup
    ? 'quotes_duplicate'
    : useCustomerQuotes
      ? 'customer_quotes'
      : 'quotes';

  if (quote_id) {
    const { data, error } = await supabase
      .from(QUOTES)
      .update({ spec, updated_at: new Date().toISOString() })
      .eq('quote_id', quote_id)
      .select('quote_id,status,quoted_price,spec')
      .single();
    if (error) throw error;
    return data;
  }

  // if no quote yet, create draft (requires customer_id)
  const { data, error } = await supabase
    .from(QUOTES)
    .insert({
      inquiry_id: inquiry_id ?? null,
      customer_id,
      status: 'draft',
      spec,
    })
    .select('quote_id,status,quoted_price,spec')
    .single();
  if (error) throw error;
  return data;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST')
      return new Response('Method Not Allowed', { status: 405 });

    const body = (await req.json()) as ChatQuoteRequest;
    console.log('[chat-quote] Received request:', {
      inquiry_id: body.inquiry_id,
      customer_id: body.customer_id,
      messages_count: body.messages?.length || 0,
      preferred_language: body.preferred_language,
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Compose model prompt
    const system = toSystem(body.preferred_language);
    const messages = toMessages(system, body.messages || []);
    // basic guard: redact obvious profanity
    const redactor = (s: string) =>
      s.replace(/\b(fuck|shit|bitch|asshole|nigger)\b/gi, '***');
    messages.forEach(m => (m.content = redactor(m.content)));

    console.log('[chat-quote] Calling LLM with messages:', messages.length);
    const { assistant, spec } = await callLLM(messages, true);
    console.log('[chat-quote] LLM response received:', {
      assistant: !!assistant,
      spec: Object.keys(spec || {}).length,
    });

    // Infer customer_id from JWT if not provided
    let customer_id = body.customer_id;
    if (!customer_id) {
      const auth = req.headers.get('Authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      if (token) {
        const { data } = await supabase.auth.getUser(token);
        customer_id = data?.user?.id || undefined;
      }
    }

    console.log('[chat-quote] Upserting quote with customer_id:', customer_id);
    const row = await upsertQuote(supabase, {
      inquiry_id: body.inquiry_id,
      quote_id: body.quote_id,
      customer_id,
      spec,
    });

    const resp: ChatQuoteResponse = {
      assistant,
      spec: row.spec || spec,
      quote_id: row.quote_id,
      status: row.status,
    };

    console.log('[chat-quote] Returning response:', {
      quote_id: row.quote_id,
      status: row.status,
    });
    return new Response(JSON.stringify(resp), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    // basic error log payload size reduced
    console.error('[chat-quote] Error:', String(e?.message || e));
    console.error('[chat-quote] Stack:', e?.stack);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
