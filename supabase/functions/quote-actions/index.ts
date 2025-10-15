// Deno Edge Function: quote-actions
// Routes: show-specs, edit-specs, propose-quote, send-for-approval, place-order
// All writes happen here with service role; RLS policies still apply for client reads.

/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type Action =
  | 'show-specs'
  | 'edit-specs'
  | 'propose-quote'
  | 'send-for-approval'
  | 'place-order';

interface RequestBody {
  action: Action;
  inquiry_id?: string;
  quote_id?: string;
  customer_id?: string; // inferred from JWT if missing
  spec_patch?: Record<string, unknown>;
  quoted_price?: number;
  notes?: string;
  valued?: boolean; // determines initial order status
}

function nowISO() {
  return new Date().toISOString();
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST')
      return new Response('Method Not Allowed', { status: 405 });
    const body = (await req.json()) as RequestBody;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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

    // Resolve runtime table names (prefer *_duplicate when available)
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
    const useInquiriesDup = await tableExists('inquiries_duplicate');
    const useOrdersDup = await tableExists('orders_duplicate');

    const QUOTES = useQuotesDup ? 'quotes_duplicate' : 'customer_quotes';
    const INQUIRIES = useInquiriesDup ? 'inquiries_duplicate' : 'inquiries';
    const ORDERS = useOrdersDup ? 'orders_duplicate' : 'orders';

    // Ensure we have quote row
    async function getOrCreateQuote() {
      if (body.quote_id) {
        const { data, error } = await supabase
          .from(QUOTES)
          .select('*')
          .eq('quote_id', body.quote_id)
          .single();
        if (error) throw error;
        return data;
      }
      // create draft if none
      const { data, error } = await supabase
        .from(QUOTES)
        .insert({
          inquiry_id: body.inquiry_id ?? null,
          customer_id,
          status: 'draft',
          spec: {},
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    }

    const action = body.action;
    if (action === 'show-specs') {
      const row = await getOrCreateQuote();
      return new Response(
        JSON.stringify({
          quote_id: row.quote_id,
          status: row.status,
          spec: row.spec,
          quoted_price: row.quoted_price,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'edit-specs') {
      const row = await getOrCreateQuote();
      const nextSpec = { ...(row.spec || {}), ...(body.spec_patch || {}) };
      const { data, error } = await supabase
        .from(QUOTES)
        .update({ spec: nextSpec, status: 'draft', updated_at: nowISO() })
        .eq('quote_id', row.quote_id)
        .select('quote_id,status,spec,quoted_price')
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'propose-quote') {
      const row = await getOrCreateQuote();
      const { data, error } = await supabase
        .from(QUOTES)
        .update({
          quoted_price: body.quoted_price ?? row.quoted_price,
          status: 'proposed',
          notes: body.notes ?? row.notes,
          updated_at: nowISO(),
        })
        .eq('quote_id', row.quote_id)
        .select('quote_id,status,spec,quoted_price,notes')
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'send-for-approval') {
      const row = await getOrCreateQuote();
      if (row.status !== 'proposed') {
        await supabase
          .from(QUOTES)
          .update({ status: 'proposed', updated_at: nowISO() })
          .eq('quote_id', row.quote_id);
      }
      return new Response(
        JSON.stringify({
          ok: true,
          quote_id: row.quote_id,
          status: 'proposed',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'place-order') {
      const row = await getOrCreateQuote();
      if (row.status !== 'proposed') {
        return new Response(
          JSON.stringify({
            error: 'Quote must be proposed before placing order.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const initialStatus = body.valued ? 'Processing' : 'Awaiting Payment';
      const { data: order, error: insErr } = await supabase
        .from(ORDERS)
        .insert({
          quote_id: row.quote_id,
          customer_id,
          order_status: initialStatus,
          spec: row.spec || {},
          quoted_price: row.quoted_price ?? null,
        })
        .select('order_id, order_status')
        .single();
      if (insErr) throw insErr;
      await supabase
        .from(QUOTES)
        .update({ status: 'agreed', updated_at: nowISO() })
        .eq('quote_id', row.quote_id);
      return new Response(
        JSON.stringify({
          ok: true,
          order_id: order.order_id,
          order_status: order.order_status,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
