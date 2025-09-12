import type { ChatFlow } from '../../../types/chatFlow';
import { mockServices } from '../../../data/services';

function normalizeServiceStatus(input: string): 'Active' | 'Inactive' | null {
  const t = input.toLowerCase();
  if (t.startsWith('act')) return 'Active';
  if (t.startsWith('inact') || t.startsWith('deac') || t.startsWith('dis'))
    return 'Inactive';
  return null;
}

function findService(idOrCode: string) {
  const id = idOrCode.toUpperCase();
  return mockServices.find(
    s => s.id.toUpperCase() === id || s.code.toUpperCase() === id
  );
}

export const portfolioFlow: ChatFlow = {
  id: 'admin-portfolio',
  title: 'Admin Portfolio',
  initial: () => [
    {
      role: 'printy',
      text: 'Portfolio assistant ready. What would you like to do?',
    },
  ],
  quickReplies: () => ['Change Service Status', 'Add Service', 'End Chat'],
  respond: async (_ctx, input) => {
    const text = input.trim();
    const lower = text.toLowerCase();

    if (lower === 'end chat' || lower === 'end') {
      return {
        messages: [{ role: 'printy', text: 'Thanks! Chat ended.' }],
        quickReplies: ['End Chat'],
      };
    }

    // Change service status: "set SRV-CP011 to Active"
    const statusMatch =
      /(?:change|set)\s*(?:the\s*)?status\s*(?:of\s*)?(SRV-[A-Z0-9]+)?.*\bto\b\s*(\w+)/i.exec(
        text
      ) || /\b(SRV-[A-Z0-9]+)\b.*\b(Active|Inactive)\b/i.exec(text);
    if (statusMatch) {
      const id = statusMatch[1];
      const target = statusMatch[2];
      const service = id ? findService(id) : null;
      const status = normalizeServiceStatus(target);
      if (!service) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'Please specify a valid service code (e.g., SRV-CP011).',
            },
          ],
          quickReplies: ['Change Service Status', 'Add Service', 'End Chat'],
        };
      }
      if (!status) {
        return {
          messages: [
            { role: 'printy', text: 'Valid statuses: Active or Inactive.' },
          ],
          quickReplies: ['Active', 'Inactive', 'End Chat'],
        };
      }
      return {
        messages: [
          {
            role: 'printy',
            text: `Okay. Updating ${service.code} (${service.name}) to ${status}.`,
          },
          { role: 'printy', text: 'Mock update applied.' },
        ],
        quickReplies: ['Change Service Status', 'Add Service', 'End Chat'],
      };
    }

    // Add service: "add service: Name=Menu Board; Code=SRV-NEW001; Category=Large Format"
    const addMatch =
      /add\s+service\s*:\s*name=(.+?);\s*code=(.+?);\s*category=(.+)$/i.exec(
        text
      );
    if (addMatch) {
      const name = addMatch[1].trim();
      const code = addMatch[2].trim().toUpperCase();
      const category = addMatch[3].trim();
      return {
        messages: [
          {
            role: 'printy',
            text: `Creating service ${name} (${code}) in category "${category}"…`,
          },
          {
            role: 'printy',
            text: 'Mock service created (status Active by default).',
          },
        ],
        quickReplies: ['Change Service Status', 'End Chat'],
      };
    }

    return {
      messages: [
        {
          role: 'printy',
          text: 'Try: "Set SRV-CP011 to Active" or "Add service: Name=Menu Board; Code=SRV-NEW001; Category=Large Format"',
        },
      ],
      quickReplies: ['Change Service Status', 'Add Service', 'End Chat'],
    };
  },
};
