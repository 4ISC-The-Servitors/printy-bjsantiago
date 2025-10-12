// scripts/test-llm.ts
import { generateJSON } from '../src/features/api/llmClient';

const preferredLanguage: 'tl' | 'en' = 'tl'; // switch to 'en' to test English

const system = `
You are Printy. Extract a clean JSON spec from free-text. Keep it short and structured.
- Language: respond in Tagalog if preferred_language=tl else English.
- Do NOT invent prices.
- Accept free-form product names when codes don't exist.
- Dynamic fields: if a field isn't mentioned, omit it; don't guess.
- Put unknown or extra details under "others" as strings.
- Sizes may be arbitrary (e.g., 10.7cm x 21.3cm); keep user units as-is.
- Output ONLY a JSON object. No prose.
JSON shape:
{
  "language": "tl|en",
  "product_name": string,               // free-form
  "service_code": string|undefined,     // optional known code if confidently present, else omit
  "category": string|undefined,         // optional (e.g., "Packaging")
  "description": string|undefined,
  "size": string|undefined,             // keep units verbatim
  "materials": string[]|undefined,
  "color": string|undefined,
  "finishing": string[]|undefined,
  "others": string[]|undefined,         // any extra constraints (e.g., "glow ink", "extra pocket")
  "quantity": number|undefined,
  "artwork": string|undefined,          // e.g., "provided", "need design"
  "deadline": string|undefined,         // user wording or ISO if they gave it
  "notes": string|undefined
}
`;

const heavyTL = `
Gusto ko ng custom packaging para sa sabon. Hindi standard size — mga 7.3cm x 9.8cm x 3.1cm ang kahon (L x W x H).
Matte finish sa labas, tapos may window cutout sa harap (die-cut) na hugis oval, mga 4cm x 2cm.
Kulay full color printing sa labas, plain sa loob.
Material dapat matibay pero hindi sobrang kapal — siguro mga 300gsm ivory board or similar. 
Lamination: matte, pero gusto ko ring subukan kung puwedeng spot UV sa logo lang.
Quantity 2500 pcs.
May ibang idea rin: baka gusto ko ng ribbon slot sa taas (para mastylish), kung puwede i-suggest ninyo.
Walang standard dieline ako ngayon, pero may rough sketch ako. Deadline sana within 3 weeks.
`;

const heavyEN = `
I need custom cartons for tea sachets. Not a standard size — about 10.7cm x 21.3cm x 4.4cm (L x W x H).
Outside should be full color, inside can be blank. Prefer 350gsm SBS or equivalent.
Finish: gloss lamination outside. Consider foil stamping (gold) on the brand name if possible.
We also want a tear-open perforation and a tuck lock. Color accuracy is important (Pantone 186C).
Quantity 8,000 units. We have print-ready artwork. Target completion: before Nov 20.
Also considering an inner divider (2 slots) — please include as an option.
`;

(async () => {
  const user = preferredLanguage === 'tl' ? heavyTL : heavyEN;

  const msgs = [
    { role: 'system', content: system.trim() + `\npreferred_language=${preferredLanguage}` },
    { role: 'user', content: user.trim() },
  ];

  const result = await generateJSON(msgs, true);
  console.log(result);
})();