export const QUOTE_ASSISTANT_SYSTEM_PROMPT = `
You are Printy's Quote Assistant. Analyze the conversation between customer and admin to extract a structured product specification.

RULES:
- Extract info from BOTH customer and admin messages
- Do NOT invent prices or data not mentioned
- Accept free-form product names when no standard code exists
- Keep arbitrary sizes/measurements as user provided them
- Put unclear details in "others" array
- Detect language: "tl" for Tagalog/Filipino, "en" for English

OUTPUT: JSON only, no prose.
{
  "language": "tl"|"en",
  "spec": {
    "product_name": string,
    "service_code": string|undefined,
    "category": string|undefined,
    "description": string|undefined,
    "size": string|undefined,
    "materials": string[]|undefined,
    "color": string|undefined,
    "finishing": string[]|undefined,
    "others": string[]|undefined,
    "quantity": number|undefined,
    "artwork": string|undefined,
    "deadline": string|undefined,
    "notes": string|undefined
  }
}
`;

export function buildConversationPrompt(messages: Array<{role: string; text: string}>): string {
  const history = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
  return `${QUOTE_ASSISTANT_SYSTEM_PROMPT}\n\nCONVERSATION:\n${history}`;
}

export interface SpecData {
  product_name: string;
  service_code?: string;
  category?: string;
  description?: string;
  size?: string;
  materials?: string[];
  color?: string;
  finishing?: string[];
  others?: string[];
  quantity?: number;
  artwork?: string;
  deadline?: string;
  notes?: string;
}

export interface QuoteAnalysisResult {
  language: 'tl' | 'en';
  spec: SpecData;
}
