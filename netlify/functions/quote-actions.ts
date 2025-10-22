import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

function getSupabase(accessToken?: string) {
  const url = process.env.SUPABASE_URL as string;
  const anon = process.env.SUPABASE_ANON_KEY as string;
  return createClient(url, anon, {
    global: { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} },
  });
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const authz = (event.headers['authorization'] || event.headers['Authorization']) as string | undefined;
    const accessToken = authz ? authz.split(' ')[1] : undefined;
    const supabase = getSupabase(accessToken);

    const params = JSON.parse(event.body || '{}');
    const action = params?.action as string;
    if (!action) return { statusCode: 400, body: JSON.stringify({ error: 'action required' }) };

    switch (action) {
      case 'show-specs': {
        const id = params.quote_id || params.inquiry_id;
        if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id required' }) };
        const { data, error } = await supabase.from('quotes').select('*').eq('id', id).single();
        if (error) return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
        return { statusCode: 200, body: JSON.stringify({ quote_id: id, status: data.status, spec: data.spec, quoted_price: data.quoted_price }) };
      }
      case 'edit-specs': {
        const id = params.quote_id || params.inquiry_id;
        if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id required' }) };
        const { error } = await supabase.from('quotes').update({ spec: params.spec_patch }).eq('id', id);
        if (error) return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      }
      case 'propose-quote': {
        const { quote_id, quoted_price, notes } = params;
        if (!quote_id || typeof quoted_price !== 'number') return { statusCode: 400, body: JSON.stringify({ error: 'quote_id and quoted_price required' }) };
        const { error } = await supabase.from('quotes').update({ quoted_price, notes, status: 'proposed' }).eq('id', quote_id);
        if (error) return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      }
      case 'send-for-approval': {
        const { quote_id } = params;
        if (!quote_id) return { statusCode: 400, body: JSON.stringify({ error: 'quote_id required' }) };
        const { error } = await supabase.from('quotes').update({ status: 'pending_approval' }).eq('id', quote_id);
        if (error) return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      }
      case 'place-order': {
        const { quote_id, valued } = params;
        if (!quote_id || typeof valued !== 'boolean') return { statusCode: 400, body: JSON.stringify({ error: 'quote_id and valued required' }) };
        const { error } = await supabase.from('quotes').update({ status: valued ? 'ordered' : 'rejected' }).eq('id', quote_id);
        if (error) return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      }
      default:
        return { statusCode: 400, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
    }
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'server error' }) };
  }
};


