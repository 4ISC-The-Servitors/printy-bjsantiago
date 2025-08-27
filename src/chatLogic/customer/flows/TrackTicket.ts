import type { BotMessage, ChatFlow } from '../../../types/chatFlow';

type Option = { label: string; next: string };
type Node = {
  id: string;
  message?: string;
  question?: string;
  answer?: string;
  options: Option[];
};

const NODES: Record<string, Node> = {
  track_ticket_start: {
    id: 'track_ticket_start',
    message:
      "Hi! I'm Printy 🤖. I can help you track your support ticket. Do you have your ticket number?",
    options: [
      { label: 'Yes, I have a ticket number', next: 'has_ticket_number' },
      { label: 'No, I need to find my ticket', next: 'no_ticket_number' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  has_ticket_number: {
    id: 'has_ticket_number',
    question: 'Ticket Number',
    answer:
      'Great! Please provide your ticket number (e.g., TCK-000123) and I will check the status for you.',
    options: [
      { label: 'Check another ticket', next: 'has_ticket_number' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  no_ticket_number: {
    id: 'no_ticket_number',
    question: 'No Ticket Number',
    answer:
      'No problem! I can help you find your ticket. What email address did you use when creating the ticket?',
    options: [
      { label: 'Search by email', next: 'search_by_email' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  search_by_email: {
    id: 'search_by_email',
    question: 'Search by Email',
    answer:
      'I will search for tickets associated with your email address. Please provide the email you used.',
    options: [
      { label: 'Search again', next: 'search_by_email' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  end: {
    id: 'end',
    answer: 'Thank you for chatting with Printy! Have a great day. 👋',
    options: [],
  },
};

let currentNodeId: keyof typeof NODES = 'track_ticket_start';

function nodeToMessages(node: Node): BotMessage[] {
  if (node.message) return [{ role: 'printy', text: node.message }];
  if (node.answer) return [{ role: 'printy', text: node.answer }];
  return [];
}

function nodeQuickReplies(node: Node): string[] {
  return node.options.map(o => o.label);
}

export const trackTicketFlow: ChatFlow = {
  id: 'track-ticket',
  title: 'Track a Ticket',
  initial: () => {
    currentNodeId = 'track_ticket_start';
    return nodeToMessages(NODES[currentNodeId]);
  },
  quickReplies: () => nodeQuickReplies(NODES[currentNodeId]),
  respond: async (_ctx, input) => {
    const current = NODES[currentNodeId];
    const selection = current.options.find(
      o => o.label.toLowerCase() === input.trim().toLowerCase()
    );
    if (!selection) {
      return {
        messages: [
          { role: 'printy', text: 'Please choose one of the options.' },
        ],
        quickReplies: nodeQuickReplies(current),
      };
    }
    currentNodeId = selection.next as keyof typeof NODES;
    const node = NODES[currentNodeId];
    const messages = nodeToMessages(node);
    const quickReplies = nodeQuickReplies(node);
    // If user chose End Chat option, still provide the closing message and a single End Chat button
    if (currentNodeId === 'end') {
      return { messages, quickReplies: ['End Chat'] };
    }
    return { messages, quickReplies };
  },
};
