export const QUOTE_ASSISTANT_SYSTEM_PROMPT = `
You are Printy's Quote Assistant. Analyze the conversation between customer and admin to extract a structured product specification.

RULES:
- Extract info from BOTH customer and admin messages
- Do NOT invent prices or data not mentioned
- Accept free-form product names when no standard code exists
- Keep arbitrary sizes/measurements as user provided them
- Put unclear details in "others" array
- Detect language: "tl" for Tagalog/Filipino, "en" for English
- CRITICAL: Preserve the original language in ALL extracted fields. If customer wrote in Tagalog/Taglish, keep the spec in Tagalog/Taglish. If in English, keep in English.
- Do NOT translate customer's original words to English
- IGNORE file upload references: Do NOT include file URLs, "Files uploaded:", "Uploaded Files:", or any supabase:// URLs in the specification. These are attachment metadata and should be completely excluded from the analysis.

OUTPUT: JSON only, no prose.
{
  "language": "tl"|"en",
  "spec": {
    "product_name": string,
    "service_id": string|undefined,
    "category": string|undefined,
    "description": string|undefined,
    "size": string|undefined,
    "materials": string[]|undefined,
    "color": string|undefined,
    "finishing": string[]|undefined,
    "quantity": number|undefined,
    "deadline": string|undefined,
    "delivery_method": string|undefined,
  }
}
`;

// Regex pattern to match file upload URLs (order-uploads, payment-proofs, etc.)
const FILE_UPLOAD_URL_REGEX = /supabase:\/\/[^\s,"')\]]+/gi;

// Patterns to identify file upload-related text
const FILE_UPLOAD_PREFIXES = [
  /^Files uploaded:\s*/i,
  /^Uploaded Files?:\s*/i,
  /^Uploaded file\(s\):\s*/i,
];

/**
 * Cleans message text by removing file upload URLs and related text
 * @param text - The message text to clean
 * @returns Cleaned message text without file upload references
 */
function cleanMessageText(text: string): string {
  if (!text) return text;

  // Remove file upload URLs
  let cleaned = text.replace(FILE_UPLOAD_URL_REGEX, '');

  // Clean up artifacts: remove commas/spaces left by URL removal
  cleaned = cleaned.replace(/,\s*,/g, ','); // Double commas
  cleaned = cleaned.replace(/,\s+/g, ' '); // Comma followed by space
  cleaned = cleaned.replace(/\s+,/g, ' '); // Space followed by comma
  cleaned = cleaned.replace(/,\s*$/gm, ''); // Trailing comma on line
  cleaned = cleaned.replace(/^\s*,\s*/gm, ''); // Leading comma on line

  // Split into lines and process each line
  const lines = cleaned.split('\n');
  const filteredLines = lines
    .map(line => {
      const trimmed = line.trim();

      // If line is empty after URL removal, skip it
      if (!trimmed) return null;

      // If line is empty after URL removal, skip it
      if (!trimmed) return null;

      // Check if line starts with file upload prefix
      for (const prefix of FILE_UPLOAD_PREFIXES) {
        if (prefix.test(trimmed)) {
          // Remove the prefix and any trailing colon/punctuation
          let afterPrefix = trimmed.replace(prefix, '').trim();
          // Remove leading colon if present (leftover from "Files uploaded:")
          afterPrefix = afterPrefix.replace(/^:\s*/, '').trim();
          // If only punctuation, whitespace, or nothing remains, skip the line
          if (!afterPrefix || /^[,;\s:]*$/.test(afterPrefix)) {
            return null;
          }
          // Otherwise, return the remaining text after removing prefix
          return afterPrefix;
        }
      }

      // If line contains only punctuation or whitespace, skip it
      if (/^[,;\s:]*$/.test(trimmed)) {
        return null;
      }

      return trimmed;
    })
    .filter((line): line is string => line !== null);

  cleaned = filteredLines.join('\n').trim();

  // Final cleanup
  cleaned = cleaned.replace(/,\s*$/g, ''); // Remove trailing comma from entire text
  cleaned = cleaned.replace(/^\s*,\s*/g, ''); // Remove leading comma
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Normalize multiple newlines
  cleaned = cleaned.replace(/\s{2,}/g, ' '); // Normalize multiple spaces

  return cleaned;
}

export function buildConversationPrompt(
  messages: Array<{ role: string; text: string }>
): string {
  // Clean messages to remove file upload references
  const cleanedMessages = messages
    .map(m => ({
      role: m.role,
      text: cleanMessageText(m.text),
    }))
    // Filter out messages that are only file upload references
    .filter(m => m.text.trim().length > 0);

  const history = cleanedMessages
    .map(m => `${m.role.toUpperCase()}: ${m.text}`)
    .join('\n\n');
  return `${QUOTE_ASSISTANT_SYSTEM_PROMPT}\n\nCONVERSATION:\n${history}`;
}

export interface SpecData {
  product_name: string;
  service_id?: string;
  category?: string;
  description?: string;
  size?: string;
  materials?: string[];
  color?: string;
  finishing?: string[];
  quantity?: number;
  deadline?: string;
  delivery_method?: string;
  quoted_price?: number;
}

export interface QuoteAnalysisResult {
  language: 'tl' | 'en';
  spec: SpecData;
}
