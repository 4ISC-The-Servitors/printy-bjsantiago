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


