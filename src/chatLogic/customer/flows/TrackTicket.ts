import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { supabase } from '../../../lib/supabase'; // make sure supabase client is imported

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

    // ====================
    // Handle Ticket Status Inquiry
    // ====================
    if (!selection && currentNodeId === 'has_ticket_number') {
      const inquiryId = input.trim().replace(/[^a-zA-Z0-9-]/g, ''); // sanitize input

      if (!inquiryId) {
        return {
          messages: [
            { role: 'printy', text: 'Please enter a valid ticket number (inquiry ID).' },
          ],
          quickReplies: nodeQuickReplies(NODES.has_ticket_number),
        };
      }

      const { data: inquiry, error } = await supabase
        .from('inquiries')
        .select(
          'inquiry_id, inquiry_message, inquiry_type, inquiry_status, resolution_comments, received_at'
        )
        .eq('inquiry_id', inquiryId)
        .single();

      if (error || !inquiry) {
        return {
          messages: [
            {
              role: 'printy',
              text: `I couldn't find a ticket with ID "${inquiryId}". Please check and try again.`,
            },
          ],
          quickReplies: nodeQuickReplies(NODES.has_ticket_number),
        };
      }

      const lines = [
        `📌 Ticket ID: ${inquiry.inquiry_id}`,
        `📝 Issue submitted: ${inquiry.inquiry_message || '(no message provided)'}`,
        `📂 Issue type: ${inquiry.inquiry_type || '(not specified)'}`,
        `📅 Received: ${new Date(inquiry.received_at).toLocaleString()}`,
        `📊 Status: ${inquiry.inquiry_status}`,
        inquiry.resolution_comments
          ? `✅ Resolution: ${inquiry.resolution_comments}`
          : '✅ Resolution: (not yet provided)',
      ];

      return {
        messages: lines.map(line => ({ role: 'printy', text: line })),
        quickReplies: nodeQuickReplies(NODES.has_ticket_number),
      };
    }

    // ====================
    // Default navigation
    // ====================
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

    if (currentNodeId === 'end') {
      return { messages, quickReplies: ['End Chat'] };
    }

    return { messages, quickReplies };
  },
};

