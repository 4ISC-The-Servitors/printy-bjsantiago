import type { ChatFlow } from '../../../types/chatFlow';
import { mockTickets } from '../../../data/tickets';

function normalizeTicketStatus(
  input: string
): 'Open' | 'Pending' | 'Closed' | null {
  const t = input.toLowerCase();
  if (t.startsWith('open')) return 'Open';
  if (t.startsWith('pend')) return 'Pending';
  if (t.startsWith('clos')) return 'Closed';
  return null;
}

function findTicket(idOrText: string) {
  const id = idOrText.toUpperCase();
  return mockTickets.find(t => t.id.toUpperCase() === id);
}

export const ticketsFlow: ChatFlow = {
  id: 'admin-tickets',
  title: 'Admin Tickets',
  initial: () => [
    {
      role: 'printy',
      text: 'Tickets assistant ready. What would you like to do?',
    },
  ],
  quickReplies: () => ['Change Ticket Status', 'Reply to Ticket', 'End Chat'],
  respond: async (_ctx, input) => {
    const text = input.trim();
    const lower = text.toLowerCase();

    if (lower === 'end chat' || lower === 'end') {
      return {
        messages: [{ role: 'printy', text: 'Thanks! Chat ended.' }],
        quickReplies: ['End Chat'],
      };
    }

    // Change status: "set TCK-2981 to Pending" or "change status TCK-2981 to Closed"
    const statusMatch =
      /(?:change|set)\s*(?:the\s*)?status\s*(?:of\s*)?(TCK-\d+)?.*\bto\b\s*(\w+)/i.exec(
        text
      ) || /\b(TCK-\d+)\b.*\b(Open|Pending|Closed)\b/i.exec(text);
    if (statusMatch) {
      const id = statusMatch[1];
      const target = statusMatch[2];
      const ticket = id ? findTicket(id) : null;
      const status = normalizeTicketStatus(target);
      if (!ticket) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'Please specify a valid ticket id (e.g., TCK-2981).',
            },
          ],
          quickReplies: ['Change Ticket Status', 'Reply to Ticket', 'End Chat'],
        };
      }
      if (!status) {
        return {
          messages: [
            { role: 'printy', text: 'Valid statuses: Open, Pending, Closed.' },
          ],
          quickReplies: ['Open', 'Pending', 'Closed', 'End Chat'],
        };
      }
      return {
        messages: [
          {
            role: 'printy',
            text: `Okay. Updating ${ticket.id} from ${ticket.status} to ${status}.`,
          },
          { role: 'printy', text: 'Mock update applied.' },
        ],
        quickReplies: ['Change Ticket Status', 'Reply to Ticket', 'End Chat'],
      };
    }

    // Reply to ticket: "reply to TCK-2981: Please provide the invoice number"
    const replyMatch =
      /reply\s*(?:to\s*)?(TCK-\d+)\s*:\s*(.+)$/i.exec(text) ||
      /\b(TCK-\d+)\b.*reply.*?:\s*(.+)$/i.exec(text);
    if (replyMatch) {
      const id = replyMatch[1];
      const body = replyMatch[2];
      const ticket = findTicket(id);
      if (!ticket) {
        return {
          messages: [{ role: 'printy', text: `Ticket ${id} not found.` }],
          quickReplies: ['Reply to Ticket', 'Change Ticket Status', 'End Chat'],
        };
      }
      return {
        messages: [
          { role: 'printy', text: `Posting reply to ${ticket.id}: "${body}"` },
          { role: 'printy', text: 'Mock reply posted.' },
        ],
        quickReplies: ['Change Ticket Status', 'End Chat'],
      };
    }

    return {
      messages: [
        {
          role: 'printy',
          text: 'Try: "Set TCK-2981 to Closed" or "Reply to TCK-2981: <message>"',
        },
      ],
      quickReplies: ['Change Ticket Status', 'Reply to Ticket', 'End Chat'],
    };
  },
};
