// src/features/api/llmClient.ts
export type LLMMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Calls are routed via Netlify Function to keep API keys server-side

export async function generateJSON(messages: LLMMessage[], forceJson = false) {
  return generateWithCohere(messages, forceJson);
}

export async function generateWithCohere(
  messages: LLMMessage[],
  forceJson = false,
  modelOverride?: string
): Promise<any> {
  // Try /api first; if 404 (redirect missing), fallback to direct Netlify path
  const tryFetch = async (url: string) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, forceJson, model: modelOverride }),
  });
  let res = await tryFetch('/api/llm-chat');
  if (res.status === 404) res = await tryFetch('/.netlify/functions/llm-chat');
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`LLM error ${res.status}: ${errorText}`);
  }
  
  const data = await res.json();
  const text = data.text || '';
  
  if (forceJson) {
    try {
      return JSON.parse(text);
    } catch {}
    const fixed = text.replace(/```json|```/g, '').trim();
    return JSON.parse(fixed);
  }
  return text;
}