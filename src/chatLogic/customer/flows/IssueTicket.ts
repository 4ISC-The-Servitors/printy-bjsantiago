import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { supabase } from '../../../lib/supabase';

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
let collectedIssueDetails = '';

const DETAIL_NODE_IDS = new Set<keyof typeof NODES>([
  'quality_issue',
  'delivery_issue',
  'billing_issue',
  'other_issue',
]);

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
    collectedIssueDetails = '';
    return nodeToMessages(NODES[currentNodeId]);
  },
  quickReplies: () => nodeQuickReplies(NODES[currentNodeId]),
  respond: async (_ctx, input) => {
    const current = NODES[currentNodeId];
    const selection = current.options.find(
      o => o.label.toLowerCase() === input.trim().toLowerCase()
    );
    if (!selection) {
      if (DETAIL_NODE_IDS.has(currentNodeId)) {
        const detail = input.trim();
        if (detail) {
          collectedIssueDetails = collectedIssueDetails
            ? `${collectedIssueDetails}\n${detail}`
            : detail;
          return {
            messages: [
              {
                role: 'printy',
                text:
                  "Got it. I've added that to your ticket notes. You can add more details or choose 'Submit ticket' when ready.",
              },
            ],
            quickReplies: nodeQuickReplies(current),
          };
        }
      }
      return {
        messages: [
          { role: 'printy', text: 'Please choose one of the options.' },
        ],
        quickReplies: nodeQuickReplies(current),
      };
    }

    const nextNodeId = selection.next as keyof typeof NODES;

    if (nextNodeId === 'submit_ticket') {
      const inquiryId = (crypto as any)?.randomUUID?.()
        ? (crypto as any).randomUUID()
        : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      const message = collectedIssueDetails || '(no details provided)';
      try {
        const { error } = await supabase.from('inquiries').insert([
          {
            inquiry_id: inquiryId,
            inquiry_message: message,
            inquiry_status: 'new',
            received_at: new Date().toISOString(),
          },
        ]);
        if (error) {
          console.error('Insert into inquiries failed:', error);
          return {
            messages: [
              {
                role: 'printy',
                text:
                  `I couldn't create the ticket right now (db error). Please try 'Submit ticket' again in a moment.`,
              },
            ],
            quickReplies: nodeQuickReplies(current),
          };
        }
        collectedIssueDetails = '';
      } catch (_e) {
        console.error('Network or unexpected error inserting inquiry:', _e);
        return {
          messages: [
            {
              role: 'printy',
              text:
                "I ran into a network issue while creating your ticket. Please try 'Submit ticket' again.",
            },
          ],
          quickReplies: nodeQuickReplies(current),
        };
      }
    }

    currentNodeId = nextNodeId;
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
