// scripts/test-llm-convo-free.ts
import { generateJSON } from '../src/features/api/llmClient';

type Role = 'customer' | 'admin';
type Turn = { speaker: Role; text: string };

const preferredLanguage: 'tl' | 'en' = 'tl'; // switch to 'en' to test English

const system = `
You are Printy. Maintain a live structured spec from an evolving conversation and reply briefly.
- Language: reply in Tagalog if preferred_language=tl else in English.
- No buttons. No quick replies. Only short assistant text + the spec snapshot.
- Do NOT invent prices. Admin will propose price outside your output.
- Accept free-form product names if no code exists.
- Unknown fields: omit; do not guess.
- Arbitrary sizes allowed (keep user-provided units).
- If the ADMIN asks to "show spec" (e.g., "pakilabas ang buong spec" or "show spec"), acknowledge and update assistant text normally; always return the full spec below.

Return ONLY a JSON object on every turn:
{
  "language": "tl|en",
  "assistant": { "text": string },
  "spec": {
    "product_name"?: string,
    "service_code"?: string,
    "category"?: string,
    "description"?: string,
    "size"?: string,
    "materials"?: string[],
    "color"?: string,
    "finishing"?: string[],
    "others"?: string[],
    "quantity"?: number,
    "artwork"?: string,
    "deadline"?: string,
    "notes"?: string
  }
}
`;

const convo: Turn[] = [
  { speaker: 'customer', text: 'Hi, gusto ko ng custom packaging para sa sabon, hindi standard size.' },
  { speaker: 'customer', text: 'Mga 7.3cm x 9.8cm x 3.1cm (L x W x H) sana yung kahon. Matte finish sa labas.' },
  { speaker: 'customer', text: 'May window cutout sa harap na oval, mga 4cm x 2cm. Full color printing sa labas.' },
  { speaker: 'admin',    text: 'Noted. Material suggestion: 300gsm ivory board. Okay ba yun?' },
  { speaker: 'customer', text: 'Oo, puwede 300gsm ivory board. Tapos kung puwede spot UV sa logo.' },
  { speaker: 'customer', text: 'Quantity 2500 pcs. May rough sketch ako, walang final dieline.' },
  { speaker: 'admin',    text: 'Deadline target ninyo?' },
  { speaker: 'customer', text: 'Within 3 weeks sana. Kung puwede may ribbon slot sa taas.' },
  { speaker: 'admin',    text: 'Noted. Price to follow after internal check.' },
  { speaker: 'admin',    text: 'Pakilabas ang buong spec ngayon para ma-review ko.' } // "show spec" trigger
];

function toMessages(history: Turn[]) {
  const msgs: { role: 'system' | 'user'; content: string }[] = [];
  msgs.push({ role: 'system', content: system.trim() + `\npreferred_language=${preferredLanguage}` });
  for (const t of history) {
    if (t.speaker === 'customer') msgs.push({ role: 'user', content: `CUSTOMER: ${t.text}` });
    if (t.speaker === 'admin') msgs.push({ role: 'user', content: `ADMIN: ${t.text}` });
  }
  return msgs;
}

(async () => {
  const history: Turn[] = [];
  for (let i = 0; i < convo.length; i++) {
    history.push(convo[i]);
    const messages = toMessages(history);
    const result = await generateJSON(messages, true);

    console.log('----- TURN', i, `(${convo[i].speaker}) -----`);
    console.log('> user:', convo[i].text);
    console.log('\n< assistant:', result.assistant?.text || '');
    console.log('\ncurrent spec:', JSON.stringify(result.spec || {}, null, 2));
    console.log('-------------------------------------------\n');
  }
})();