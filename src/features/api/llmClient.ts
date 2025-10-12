// src/features/api/llmClient.ts
export type LLMMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const BASE_URL = import.meta.env.VITE_LLM_BASE_URL || 'https://api.cohere.ai/v1';
const MODEL = import.meta.env.VITE_LLM_MODEL || 'command';
const API_KEY = import.meta.env.VITE_COHERE_API_KEY || '';

function ensureKeyIfNeeded() {
  if (!API_KEY) {
    throw new Error('Missing LLM_API_KEY for Cohere.');
  }
}

export async function generateJSON(messages: LLMMessage[], forceJson = false) {
  return generateWithCohere(messages, forceJson);
}

export async function generateWithCohere(
  messages: LLMMessage[],
  forceJson = false
): Promise<any> {
  ensureKeyIfNeeded();
  
  // Cohere expects the last message as 'message' and previous as 'chat_history'
  const lastMessage = messages[messages.length - 1];
  const chatHistory = messages.slice(0, -1).map(m => ({
    role: m.role === 'user' ? 'USER' : 'CHATBOT',
    message: m.content,
  }));

  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      message: lastMessage.content,
      chat_history: chatHistory,
      temperature: 0.2,
      ...(forceJson ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  
  if (!res.ok) {
    throw new Error(`Cohere error ${res.status}: ${await res.text()}`);
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