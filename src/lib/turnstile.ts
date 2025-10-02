declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      execute: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      reset?: (widgetId: string) => void;
    };
  }
}

let turnstileScriptLoaded: Promise<void> | null = null;
let preToken: { action: string; token: string; ts: number } | null = null;
const debugFlag = String((import.meta as any).env?.VITE_TURNSTILE_DEBUG ?? 'false').toLowerCase();
const debugOn = !['false', '0', 'no', 'off', ''].includes(debugFlag.trim());
function dbg(...args: unknown[]) {
  if (debugOn) {
    // eslint-disable-next-line no-console
    console.info('[turnstile]', ...args);
  }
}

function loadTurnstileScript() {
  if (turnstileScriptLoaded) return turnstileScriptLoaded;
  turnstileScriptLoaded = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if (document.getElementById('cf-turnstile-script')) return resolve();
    const s = document.createElement('script');
    s.id = 'cf-turnstile-script';
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Turnstile script'));
    document.head.appendChild(s);
  });
  return turnstileScriptLoaded;
}

async function ensureTurnstile() {
  await loadTurnstileScript();
  // turnstile attaches synchronously on load; minimal wait in case of scheduling
  for (let i = 0; i < 10; i++) {
    if (window.turnstile) return window.turnstile;
    await new Promise(r => setTimeout(r, 50));
  }
  if (!window.turnstile) throw new Error('Turnstile not available');
  return window.turnstile;
}

export async function getTurnstileToken(action: string) {
  if (preToken && preToken.action === action && Date.now() - preToken.ts < 60000) {
    const t = preToken.token;
    preToken = null; // consume
    dbg('using primed token for', action);
    return t;
  }
  const siteKey = (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY as string | undefined;
  if (!siteKey) throw new Error('Missing VITE_TURNSTILE_SITE_KEY');

  const turnstile = await ensureTurnstile();
  const container = document.createElement('div');
  // Keep container out of layout flow
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  const renderOnce = () => new Promise<string>((resolve, reject) => {
    let widgetId = '';

    const cleanup = () => {
      try {
        if (widgetId) turnstile.remove(widgetId);
        if (container.parentNode) container.parentNode.removeChild(container);
      } catch {
        // ignore cleanup errors
      }
    };

    dbg('render start', { action });
    widgetId = turnstile.render(container, {
      sitekey: siteKey,
      appearance: 'execute',
      action,
      callback: (t: string) => {
        setTimeout(() => cleanup(), 250);
        dbg('token acquired', { action, len: t?.length ?? 0 });
        resolve(t);
      },
      'error-callback': () => {
        setTimeout(() => cleanup(), 250);
        dbg('render error', { action });
        reject(new Error('Turnstile error'));
      },
      'timeout-callback': () => {
        setTimeout(() => cleanup(), 250);
        dbg('render timeout', { action });
        reject(new Error('Turnstile timeout'));
      },
    } as unknown as Record<string, unknown>);
  });

  // retry once after a short delay if first attempt times out or errors
  const token = await renderOnce().catch(async () => {
    await new Promise(r => setTimeout(r, 400));
    dbg('retrying render', { action });
    return renderOnce();
  });

  return token;
}

import { supabase } from './supabase';

async function getTurnstileTokenInteractive(action: string) {
  const siteKey = (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY as string | undefined;
  if (!siteKey) throw new Error('Missing VITE_TURNSTILE_SITE_KEY');
  const turnstile = await ensureTurnstile();

  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.4)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '2147483647';

  const host = document.createElement('div');
  host.style.background = '#fff';
  host.style.padding = '16px';
  host.style.borderRadius = '8px';
  host.style.boxShadow = '0 8px 30px rgba(0,0,0,0.25)';
  host.style.display = 'inline-block';

  overlay.appendChild(host);
  document.body.appendChild(overlay);

  const removeAll = () => {
    try {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    } catch {}
  };

  return await new Promise<string>((resolve, reject) => {
    let widgetId = '';
    const cleanup = () => {
      try {
        if (widgetId && (window as any).turnstile?.remove) (window as any).turnstile.remove(widgetId);
      } catch {}
      removeAll();
    };
    widgetId = turnstile.render(host, {
      sitekey: siteKey,
      appearance: 'always',
      action,
      callback: (t: string) => {
        setTimeout(() => cleanup(), 250);
        resolve(t);
      },
      'error-callback': () => {
        setTimeout(() => cleanup(), 250);
        reject(new Error('Turnstile error'));
      },
      'timeout-callback': () => {
        setTimeout(() => cleanup(), 250);
        reject(new Error('Turnstile timeout'));
      },
    } as unknown as Record<string, unknown>);
  });
}

export async function assertHumanTurnstile(action: string) {
  // Feature flags: allow bypass per action for troubleshooting
  const globalEnable = String((import.meta as any).env?.VITE_TURNSTILE_ENABLED ?? 'true').toLowerCase();
  const enableSignIn = String((import.meta as any).env?.VITE_TURNSTILE_ENABLE_SIGNIN ?? 'true').toLowerCase();
  const enableSignUp = String((import.meta as any).env?.VITE_TURNSTILE_ENABLE_SIGNUP ?? 'true').toLowerCase();
  const enablePasswordReset = String((import.meta as any).env?.VITE_TURNSTILE_ENABLE_PASSWORD_RESET ?? 'true').toLowerCase();

  const truthy = (v: string) => !['false', '0', 'off', 'no', ''].includes(v.trim());
  const isDisabled =
    !truthy(globalEnable) ||
    (action === 'signin' && !truthy(enableSignIn)) ||
    (action === 'signup' && !truthy(enableSignUp)) ||
    (action === 'password_reset' && !truthy(enablePasswordReset));

  if (isDisabled) {
    dbg('bypass enabled for', action);
    return { token: 'bypass' } as { token: string };
  }

  // Token acquisition with a soft timeout to avoid indefinite waits
  dbg('acquiring token for', action);
  let token: string;
  try {
    const tokenPromise = getTurnstileToken(action);
    token = (await Promise.race<string>([
      tokenPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Turnstile timeout')), 12000)),
    ])) as string;
  } catch (e) {
    // Fallback: visible challenge to unblock flows when auto-exec struggles
    token = await getTurnstileTokenInteractive(action);
  }
  dbg('token acquired length', token?.length ?? 0);
  const { data, error } = await supabase.functions.invoke('verify-turnstile', {
    body: { token, action },
  });
  dbg('verify-turnstile response', { ok: data?.ok ?? false, error: Boolean(error) });
  if (error || !data?.ok) {
    throw new Error('Failed human verification');
  }
  return { token } as { token: string };
}

export async function primeTurnstile(action: string) {
  try {
    const token = await getTurnstileToken(action);
    preToken = { action, token, ts: Date.now() };
  } catch {
    // Ignore prefetch errors; real call will try again
  }
}


