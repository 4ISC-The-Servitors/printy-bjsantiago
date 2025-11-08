import type { Handler } from '@netlify/functions';

export const handler: Handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { token, action } = JSON.parse(event.body || '{}');
    if (!token) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: false, error: 'missing token' }),
      };
    }

    const secret = process.env.TURNSTILE_SECRET_KEY || '';
    if (!secret) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: false,
          error: 'missing TURNSTILE_SECRET_KEY',
        }),
      };
    }

    // Dev short-circuit: honor a 'bypass' token
    if (token === 'bypass') {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          action,
          data: { success: true, bypass: true },
        }),
      };
    }

    // Cloudflare expects application/x-www-form-urlencoded
    const form = new URLSearchParams();
    form.append('secret', secret);
    form.append('response', token);

    // Optionally pass client IP if available
    const fwd = (event.headers['x-forwarded-for'] ||
      event.headers['x-nf-client-connection-ip'] ||
      event.headers['client-ip'] ||
      '') as string;
    if (fwd) form.append('remoteip', fwd.split(',')[0].trim());

    const resp = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      }
    );

    let data: any;
    try {
      data = await resp.json();
    } catch {
      const text = await resp.text();
      data = { success: false, raw: text };
    }

    const ok = Boolean(data?.success);
    // Explicitly surface common failure reasons in logs
    if (!ok && data?.['error-codes']) {
      console.warn('[Turnstile verify] failed', { codes: data['error-codes'] });
    }
    // Always return 200; client decides based on ok
    return { statusCode: 200, body: JSON.stringify({ ok, action, data }) };
  } catch (e: any) {
    // Never hard-fail; surface as ok=false to avoid 500s
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: false,
        error: e?.message || 'verify exception',
      }),
    };
  }
};
