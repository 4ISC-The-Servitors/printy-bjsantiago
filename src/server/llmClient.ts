// src/server/llmClient.ts
export type LLMMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const PROVIDER = process.env.LLM_PROVIDER || 'groq'; // 'groq' | 'ollama'
const BASE_URL =
  process.env.LLM_BASE_URL ||
  (PROVIDER === 'groq'
    ? 'https://api.groq.com/openai/v1'
    : 'http://localhost:11434');
const MODEL =
  process.env.LLM_MODEL ||
  (PROVIDER === 'groq' ? 'llama-3.1-8b-instant' : 'dolphin3:8b');
const API_KEY = process.env.LLM_API_KEY || process.env.GROQ_API_KEY || '';

function ensureKeyIfNeeded() {
  if (PROVIDER === 'groq' && !API_KEY) {
    throw new Error('Missing LLM_API_KEY (or GROQ_API_KEY) for Groq.');
  }
}

export async function generateJSON(messages: LLMMessage[], forceJson = false) {
  if (PROVIDER === 'groq') {
    ensureKeyIfNeeded();
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.2,
        ...(forceJson ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (!res.ok)
      throw new Error(`Groq error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    if (forceJson) {
      try {
        return JSON.parse(text);
      } catch {}
      const fixed = text.replace(/```json|```/g, '').trim();
      return JSON.parse(fixed);
    }
    return text;
  }

  // Ollama native chat API (non-stream + optional JSON mode)
  const body: any = {
    model: MODEL,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: false, // ← ensure single JSON response
    options: { temperature: 0.2 },
    ...(forceJson ? { format: 'json' } : {}), // ← enforce JSON if needed
  };

  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error(`Ollama error ${res.status}: ${await res.text()}`);

  const data = await res.json(); // now a single JSON object
  const text = data?.message?.content ?? '';

  if (forceJson) {
    try {
      return JSON.parse(text);
    } catch {}
    const fixed = text.replace(/```json|```/g, '').trim();
    return JSON.parse(fixed);
  }
  return text;
}
