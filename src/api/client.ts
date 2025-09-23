import { supabase } from '../lib/supabase';

export interface EdgeFunctionOptions {
  headers?: Record<string, string>;
}

export class EdgeFunctionError extends Error {
  status?: number;
  details?: unknown;
  code?: string;

  constructor(message: string, status?: number, details?: unknown, code?: string) {
    super(message);
    this.name = 'EdgeFunctionError';
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export const invokeEdge = async <TResponse = unknown, TPayload = unknown>(
  functionName: string,
  payload?: TPayload,
  options?: EdgeFunctionOptions
): Promise<TResponse> => {
  const { data, error } = await supabase.functions.invoke<TResponse>(functionName, {
    body: payload as object,
    headers: options?.headers,
  });

  if (error) {
    throw new EdgeFunctionError(error.message || 'Edge function error', (error as any)?.status, error, (error as any)?.name);
  }

  return data as TResponse;
};

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export const invokeEdgeUrl = async <TResponse = unknown, TPayload = unknown>(
  url: string,
  payload?: TPayload,
  options?: EdgeFunctionOptions
): Promise<TResponse> => {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers ?? {}),
  };
  // Auth-only mode: require user token when calling absolute URL helpers
  if (!headers['Authorization'] && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });

  let body: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await response.json().catch(() => null);
  } else {
    body = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const message = typeof body === 'object' && body?.error
      ? String(body.error)
      : `HTTP ${response.status}`;
    // Add URL and headers context for easier debugging (exclude auth)
    const debug = {
      url,
      status: response.status,
      hasAuth: Boolean(headers['Authorization']),
      hasApiKey: Boolean(headers['apikey']),
    };
    console.error('Edge function call failed:', debug, body);
    throw new EdgeFunctionError(message, response.status, body);
  }

  return body as TResponse;
};


