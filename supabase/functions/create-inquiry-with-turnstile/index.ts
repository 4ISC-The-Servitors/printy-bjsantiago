// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function verify(token: string) {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) throw new Error('Missing TURNSTILE_SECRET_KEY');
  const params = new URLSearchParams({ secret, response: token });
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: params,
  });
  const v = await r.json();
  return v?.success === true;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { token, message, inquiry_type } = await req.json().catch(() => ({}));
  if (!token || !message) return new Response('Missing token or message', { status: 400 });

  const ok = await verify(token);
  if (!ok) {
    return new Response(JSON.stringify({ ok: false, reason: 'captcha_failed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const inquiry_id = crypto.randomUUID();
  const received_at = new Date().toISOString();

  const { error } = await supabase.from('inquiries').insert([{
    inquiry_id,
    inquiry_message: message,
    inquiry_status: 'new',
    received_at,
    inquiry_type: inquiry_type ?? 'other',
    customer_id: user.id,
  }]);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  return new Response(JSON.stringify({ ok: true, inquiry_id }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    status: 200,
  });
});


