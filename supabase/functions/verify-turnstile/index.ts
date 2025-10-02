// @ts-nocheck

type VerifyResp = {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
};

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

  const { token, action } = await req.json().catch(() => ({}));
  if (!token) return new Response('Missing token', { status: 400 });

  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) return new Response('Missing secret', { status: 500 });

  const fwd = req.headers.get('x-forwarded-for') ?? '';
  const remoteip = fwd.split(',')[0]?.trim();

  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('response', token);
  if (remoteip) params.set('remoteip', remoteip);

  const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: params,
  });
  const vr = (await resp.json()) as VerifyResp;

  const ok = vr.success === true;
  return new Response(JSON.stringify({ ok, action: vr.action ?? action }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    status: ok ? 200 : 403,
  });
});


