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
  issue_ticket_start: {
    id: 'issue_ticket_start',
    message:
      "Hi! I'm Printy 🤖. I'll help you create a support ticket. What's your order number?",
    options: [
      { label: "I don't have an order number", next: 'no_order_number' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  no_order_number: {
    id: 'no_order_number',
    question: 'No Order Number',
    answer:
      'No problem! I can still help you create a ticket. What issue are you experiencing?',
    options: [
      { label: 'Printing quality issue', next: 'quality_issue' },
      { label: 'Delivery problem', next: 'delivery_issue' },
      { label: 'Billing question', next: 'billing_issue' },
      { label: 'Other concern', next: 'other_issue' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  quality_issue: {
    id: 'quality_issue',
    question: 'Printing Quality Issue',
    answer:
      'I understand you have a printing quality concern. Please describe the issue in detail so I can create the right ticket.',
    options: [
      { label: 'Submit ticket', next: 'submit_ticket' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  delivery_issue: {
    id: 'delivery_issue',
    question: 'Delivery Problem',
    answer:
      "I'm sorry to hear about the delivery issue. Please provide details about what happened.",
    options: [
      { label: 'Submit ticket', next: 'submit_ticket' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  billing_issue: {
    id: 'billing_issue',
    question: 'Billing Question',
    answer:
      "I can help with your billing concern. Please describe the issue you're experiencing.",
    options: [
      { label: 'Submit ticket', next: 'submit_ticket' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  other_issue: {
    id: 'other_issue',
    question: 'Other Concern',
    answer:
      "I'm here to help with any other concerns you may have. Please describe the issue.",
    options: [
      { label: 'Submit ticket', next: 'submit_ticket' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  submit_ticket: {
    id: 'submit_ticket',
    question: 'Submit Ticket',
    answer:
      "Thank you for providing the details. I've created a support ticket for you. Our team will review it and get back to you within 24 hours.",
    options: [{ label: 'End Chat', next: 'end' }],
  },

  end: {
    id: 'end',
    answer: 'Thank you for chatting with Printy! Have a great day. 👋',
    options: [],
  },
};

let currentNodeId: keyof typeof NODES = 'issue_ticket_start';

function nodeToMessages(node: Node): BotMessage[] {
  if (node.message) return [{ role: 'printy', text: node.message }];
  if (node.answer) return [{ role: 'printy', text: node.answer }];
  return [];
}

function nodeQuickReplies(node: Node): string[] {
  return node.options.map(o => o.label);
}

export const issueTicketFlow: ChatFlow = {
  id: 'issue-ticket',
  title: 'Issue a Ticket',
  initial: () => {
    currentNodeId = 'issue_ticket_start';
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
