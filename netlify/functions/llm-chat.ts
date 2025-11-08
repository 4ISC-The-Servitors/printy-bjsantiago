import type { Handler } from '@netlify/functions';

export const handler: Handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages, forceJson, model } = JSON.parse(event.body || '{}');
    if (!Array.isArray(messages) || messages.length === 0) {
      return { statusCode: 400, body: 'messages required' };
    }

    const apiKey = process.env.COHERE_API_KEY || process.env.LLM_API_KEY || '';
    const baseUrl = process.env.LLM_BASE_URL || 'https://api.cohere.ai/v1';
    const mdl = model || process.env.LLM_MODEL || 'command-light';
    if (!apiKey) {
      return { statusCode: 500, body: 'Missing COHERE_API_KEY/LLM_API_KEY' };
    }

    const last = messages[messages.length - 1];
    const chat_history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'USER' : 'CHATBOT',
      message: m.content,
    }));

    const res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: mdl,
        message: last.content,
        chat_history,
        temperature: 0.2,
        ...(forceJson ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (!res.ok) {
      return { statusCode: res.status, body: await res.text() };
    }
    const data: any = await res.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ text: (data as any).text || '', raw: data }),
    };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'server error' };
  }
};
