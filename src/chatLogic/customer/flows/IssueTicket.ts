// NOTE: This scripted flow is now disabled in favor of DB-backed flow seeds.
// Leaving file for reference but excluding from registry.
import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { supabase } from '../../../lib/supabase';
import { getTurnstileToken } from '../../../lib/turnstile';

type Option = { label: string; next: string };
type Node = {
  id: string;
  message?: string;
  question?: string;
  answer?: string;
  options: Option[];
};

const NODES: Record<string, Node> = {
  issue_ticket_intro: {
    id: 'issue_ticket_intro',
    message:
      "Hi! I'm Printy. Before we start, do you already have your order number?",
    options: [
      { label: 'Yes, I have it', next: 'issue_ticket_start' },
      { label: "I don't have it", next: 'no_order_number' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  issue_ticket_start: {
    id: 'issue_ticket_start',
    message:
      "I'll help you create a support ticket. What's your order number?",
    options: [
      { label: 'Back', next: 'issue_ticket_intro' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  order_issue_menu: {
    id: 'order_issue_menu',
    answer:
      'What issue are you experiencing with this order? Choose one so I can create a ticket.',
    options: [
      { label: 'Printing quality issue', next: 'quality_issue' },
      { label: 'Delivery problem', next: 'delivery_issue' },
      { label: 'Billing question', next: 'billing_issue' },
      { label: 'Other concern', next: 'other_issue' },
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
    answer: 'Thank you for chatting with Printy! Have a great day.',
    options: [],
  },
};

let currentNodeId: keyof typeof NODES = 'issue_ticket_start';
let collectedIssueDetails = '';
let currentInquiryType: string | null = null;

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

// ====================
// Fixed quick replies generator to always respect node options
function nodeQuickReplies(node: Node): string[] {
  const labels = node.options.map(o => o.label);
  if (!labels.some(l => l.trim().toLowerCase() === 'end chat')) {
    labels.push('End Chat');
  }
  return labels;
}

export const issueTicketFlow: ChatFlow = {
  id: 'issue-ticket',
  title: 'Issue a Ticket',
  initial: () => {
    currentNodeId = 'issue_ticket_intro';
    collectedIssueDetails = '';
    currentInquiryType = null;
    return nodeToMessages(NODES[currentNodeId]);
  },
  quickReplies: () => nodeQuickReplies(NODES[currentNodeId]),
  respond: async (_ctx, input) => {
    const current = NODES[currentNodeId];

    // ====================
    // Fix for "Yes, I have it" button
    if (
      currentNodeId === 'issue_ticket_intro' &&
      input.trim().toLowerCase() === 'yes, i have it'
    ) {
      // Jump to issue_ticket_start node
      currentNodeId = 'issue_ticket_start';
      collectedIssueDetails = '';
      currentInquiryType = null;
    
      // Let nodeToMessages handle the message text
      return {
        messages: nodeToMessages(NODES[currentNodeId]),
        quickReplies: nodeQuickReplies(NODES[currentNodeId]),
      };
    }
    
    

    // ====================
    // Blacklisted words filter
    const BLACKLIST = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'nigger'];
    const flaggedWord = BLACKLIST.find(word =>
      input.toLowerCase().includes(word)
    );
    if (flaggedWord) {
      if (
        currentNodeId === 'issue_ticket_start' ||
        currentNodeId === 'no_order_number'
      ) {
        return {
          messages: [
            { role: 'printy', text: `You have entered a flagged word: "${flaggedWord}".` },
            { role: 'printy', text: 'Please type a valid order number.' },
          ],
          quickReplies: nodeQuickReplies(NODES.issue_ticket_start),
        };
      } else if (DETAIL_NODE_IDS.has(currentNodeId)) {
        return {
          messages: [
            { role: 'printy', text: `You have entered a flagged word: "${flaggedWord}".` },
            { role: 'printy', text: 'Please rephrase your description.' },
          ],
          quickReplies: nodeQuickReplies(NODES[currentNodeId]),
        };
      }
    }

    const selection = current.options.find(
      o => o.label.toLowerCase() === input.trim().toLowerCase()
    );

    // ====================
    // Backtracking handler
    if (/^(go\s*back|see\s*menu\s*again|back|menu)$/i.test(input.trim())) {
      return {
        messages: [{ role: 'printy', text: 'Where would you like to go back?' }],
        quickReplies: ['Back to start', 'Back to choosing issue type'],
      };
    }

    if (/^back$/i.test(input.trim())) {
      currentNodeId = 'issue_ticket_start';
      collectedIssueDetails = '';
      currentInquiryType = null;
      return {
        messages: nodeToMessages(NODES.issue_ticket_intro),
        quickReplies: nodeQuickReplies(NODES.issue_ticket_intro),
      };
    }

    if (/^back to choosing issue type/i.test(input.trim())) {
      currentNodeId = 'order_issue_menu';
      collectedIssueDetails = '';
      currentInquiryType = null;
      return {
        messages: nodeToMessages(NODES.order_issue_menu),
        quickReplies: nodeQuickReplies(NODES.order_issue_menu),
      };
    }

    // ====================
    // Free-text order number handling
    if (!selection && (currentNodeId === 'issue_ticket_start' || currentNodeId === 'no_order_number')) {
      const orderNumber = input.trim().replace(/[^a-zA-Z0-9-]/g, '');
      if (!orderNumber) {
        return {
          messages: [{ role: 'printy', text: 'Please enter a valid order number.' }],
          quickReplies: nodeQuickReplies(current),
        };
      }

      const { data: userData } = await supabase.auth.getUser();
      const customerId = userData?.user?.id;
      if (!customerId) {
        return {
          messages: [{ role: 'printy', text: 'You must be signed in to view orders.' }],
          quickReplies: nodeQuickReplies(current),
        };
      }

      const { data: order, error } = await supabase
        .from('orders')
        .select('order_id,order_status,order_datetime')
        .eq('order_id', orderNumber)
        .eq('customer_id', customerId)
        .maybeSingle();

      if (error || !order) {
        return {
          messages: [{ role: 'printy', text: `Order "${orderNumber}" not found.` }],
          quickReplies: nodeQuickReplies(current),
        };
      }

      const lines = [
        `Order ${order.order_id} — Status: ${order.order_status ?? 'N/A'}`,
        `Placed: ${order.order_datetime ? new Date(order.order_datetime).toLocaleString() : 'N/A'}`,
      ];

      currentNodeId = 'order_issue_menu';
      return {
        messages: [
          { role: 'printy', text: lines.join('\n') },
          { role: 'printy', text: 'Is this the correct order?' },
          ...nodeToMessages(NODES.order_issue_menu),
        ],
        quickReplies: nodeQuickReplies(NODES.order_issue_menu),
      };
    }

    // ====================
    // Free-text issue description
    if (!selection && DETAIL_NODE_IDS.has(currentNodeId)) {
      const detail = input.trim();
      if (detail) {
        collectedIssueDetails = collectedIssueDetails
          ? `${collectedIssueDetails}\n${detail}`
          : detail;
        return {
          messages: [
            { role: 'printy', text: "Got it. I've added that to your ticket notes. Add more details or choose 'Submit ticket' when ready." },
          ],
          quickReplies: nodeQuickReplies(current),
        };
      }
    }

    // ====================
    // Capture inquiry_type from issue type selection
    if (selection) {
      const nextNodeId = selection.next as keyof typeof NODES;
      if (nextNodeId === 'quality_issue') currentInquiryType = 'quality';
      if (nextNodeId === 'delivery_issue') currentInquiryType = 'delivery';
      if (nextNodeId === 'billing_issue') currentInquiryType = 'billing';
      if (nextNodeId === 'other_issue') currentInquiryType = 'other';

      if (nextNodeId === 'submit_ticket') {
        const message = collectedIssueDetails || '(no details provided)';
        const inquiryType = currentInquiryType ?? 'other';
        try {
          const token = await getTurnstileToken('issue_ticket_submit');
          const { data, error } = await supabase.functions.invoke(
            'create-inquiry-with-turnstile',
            { body: { token, message, inquiry_type: inquiryType } }
          );

          if (error || !data?.ok) {
            return {
              messages: [{ role: 'printy', text: "Couldn't create the ticket. Try again later." }],
              quickReplies: nodeQuickReplies(current),
            };
          }

          // Use display_id from function response
          const displayId = data?.display_id || '(unknown ticket number)';

          collectedIssueDetails = '';
          currentInquiryType = null;

          return {
            messages: [
              { role: 'printy', text: 'Ticket submitted successfully!' },
              { role: 'printy', text: `Your ticket number is: ${displayId}` },
            ],
            quickReplies: ['End Chat'],
          };
        } catch (_e) {
          return {
            messages: [{ role: 'printy', text: 'Error creating ticket. Please try again.' }],
            quickReplies: nodeQuickReplies(current),
          };
        }
      }

      currentNodeId = nextNodeId;
      return {
        messages: nodeToMessages(NODES[nextNodeId]),
        quickReplies: nodeQuickReplies(NODES[nextNodeId]),
      };
    }

    return {
      messages: [{ role: 'printy', text: 'Please choose one of the options.' }],
      quickReplies: nodeQuickReplies(NODES.order_issue_menu),
    };
  },
};






