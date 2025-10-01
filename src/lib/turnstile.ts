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

  const token = await new Promise<string>((resolve, reject) => {
    let widgetId = '';

    const cleanup = () => {
      try {
        if (widgetId) turnstile.remove(widgetId);
        if (container.parentNode) container.parentNode.removeChild(container);
      } catch {
        // ignore cleanup errors
      }
    };

    widgetId = turnstile.render(container, {
      sitekey: siteKey,
      appearance: 'execute',
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

  return token;
}

import { supabase } from './supabase';

export async function assertHumanTurnstile(action: string) {
  const token = await getTurnstileToken(action);
  const { data, error } = await supabase.functions.invoke('verify-turnstile', {
    body: { token, action },
  });
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


