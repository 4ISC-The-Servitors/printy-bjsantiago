import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { supabase } from '../../../lib/supabase'; // ensure Supabase client is imported

// ====================
// Type Definitions
// ====================
type Option = { label: string; next: string };
type Node = {
  id: string;
  message?: string;
  question?: string;
  answer?: string;
  options: Option[];
};

// ====================
// Chat Flow Node Map
// ====================
const NODES: Record<string, Node> = {
  track_ticket_start: {
    id: 'track_ticket_start',
    message:
      "Hi! I'm Printy. I can help you track your support ticket. Do you have your ticket number?",
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
      { label: 'Back', next: 'track_ticket_start' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  no_ticket_number: {
    id: 'no_ticket_number',
    question: 'No Ticket Number',
    answer:
      'I will display your submitted tickets. Please enter the ticket number you want to track.',
    options: [
      { label: 'Back', next: 'track_ticket_start' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  end: {
    id: 'end',
    answer: 'Thank you for chatting with Printy! Have a great day.',
    options: [],
  },
};

// ====================
// State Tracking
// ====================
let currentNodeId: keyof typeof NODES = 'track_ticket_start';
let awaitingTicketInput: boolean = false; // Flag for recent tickets input

// ====================
// Helper Functions
// ====================
function nodeToMessages(node: Node): BotMessage[] {
  if (node.message) return [{ role: 'printy', text: node.message }];
  if (node.answer) return [{ role: 'printy', text: node.answer }];
  return [];
}

function nodeQuickReplies(node: Node): string[] {
  return node.options.map((o) => o.label);
}

// ====================
// Chat Flow Definition
// ====================
export const trackTicketFlow: ChatFlow = {
  id: 'track-ticket',
  title: 'Track a Ticket',

  initial: () => {
    currentNodeId = 'track_ticket_start';
    awaitingTicketInput = false;
    return nodeToMessages(NODES[currentNodeId]);
  },

  quickReplies: () => nodeQuickReplies(NODES[currentNodeId]),

  respond: async (_ctx, input) => {
    // ====================
    // Handle input when awaiting ticket number after recent tickets
    // ====================
    if (awaitingTicketInput) {
      const ticketNumber = input.trim();
      if (!ticketNumber) {
        return {
          messages: [
            { role: 'printy', text: 'Please enter a ticket number from the list above.' },
          ],
          quickReplies: [],
        };
      }

      // Reset flag
      awaitingTicketInput = false;
      currentNodeId = 'has_ticket_number';

      // Redirect to normal ticket lookup
      return trackTicketFlow.respond(_ctx, ticketNumber);
    }

    const current = NODES[currentNodeId];
    const selection = current.options.find(
      (o) => o.label.toLowerCase() === input.trim().toLowerCase()
    );

    // ====================
    // Handle Ticket Status Inquiry (User entered Ticket ID)
    // ====================
    if (!selection && currentNodeId === 'has_ticket_number') {
      const displayId = input.trim().replace(/[^a-zA-Z0-9-]/g, ''); // sanitize input

      if (!displayId) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'Please enter a valid ticket number (e.g., TCK-000123).',
            },
          ],
          quickReplies: nodeQuickReplies(NODES.has_ticket_number),
        };
      }

      try {
        const { data: inquiry, error } = await supabase
          .from('inquiries')
          .select(
            'display_id, inquiry_type, inquiry_status, resolution_comments, received_at'
          )
          .eq('display_id', displayId)
          .single();

        if (error || !inquiry) {
          console.error('❌ Supabase error fetching ticket:', error);
          return {
            messages: [
              {
                role: 'printy',
                text: `I couldn't find a ticket with ID "${displayId}". Please check and try again.`,
              },
            ],
            quickReplies: nodeQuickReplies(NODES.has_ticket_number),
          };
        }

        const lines = [
          `Ticket ID: ${inquiry.display_id}`,
          `Issue type: ${inquiry.inquiry_type || '(not specified)'}`,
          `Received: ${new Date(inquiry.received_at).toLocaleString()}`,
          `Status: ${inquiry.inquiry_status}`,
          inquiry.resolution_comments
            ? `Resolution: ${inquiry.resolution_comments}`
            : 'Resolution: (not yet provided)',
        ];

        return {
          messages: lines.map((line) => ({ role: 'printy', text: line })),
          quickReplies: nodeQuickReplies(NODES.has_ticket_number),
        };
      } catch (err: any) {
        console.error('🚨 Unexpected error while fetching ticket:', err);
        return {
          messages: [
            {
              role: 'printy',
              text:
                'An unexpected error occurred while fetching your ticket. Please try again later.',
            },
          ],
          quickReplies: nodeQuickReplies(NODES.has_ticket_number),
        };
      }
    }

    // ====================
// Handle "No Ticket Number" → Fetch User’s Recent Tickets
// ====================
if (
  selection &&
  selection.next === 'no_ticket_number' &&
  currentNodeId !== 'no_ticket_number'
) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) console.error('⚠️ Supabase auth error:', userError);

    if (!user) {
      return {
        messages: [
          {
            role: 'printy',
            text:
              'Please log in to view your submitted tickets. I can only retrieve tickets from your account.',
          },
        ],
        quickReplies: nodeQuickReplies(NODES.no_ticket_number),
      };
    }

    const { data: tickets, error } = await supabase
      .from('inquiries')
      .select('display_id, inquiry_status, received_at')
      .eq('customer_id', user.id)
      .order('received_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Supabase query error:', error);
      return {
        messages: [
          {
            role: 'printy',
            text: 'Error retrieving your tickets. Please try again later.',
          },
        ],
        quickReplies: nodeQuickReplies(NODES.no_ticket_number),
      };
    }

    if (!tickets || tickets.length === 0) {
      return {
        messages: [
          {
            role: 'printy',
            text:
              'You have no submitted tickets. Once you create one, I can help you track it here.',
          },
        ],
        quickReplies: nodeQuickReplies(NODES.no_ticket_number),
      };
    }

    const ticketList = tickets
      .map(
        (t) =>
          `- ${t.display_id || '(no ID)'} (${t.inquiry_status || 'No status'}) — Received: ${new Date(
            t.received_at
          ).toLocaleDateString()}`
      )
      .join('\n');

    // Set flag to expect ticket input next
    awaitingTicketInput = true;

    // Add Back and End Chat buttons explicitly
    const quickReplies = ['Back', 'End Chat'];

    return {
      messages: [
        {
          role: 'printy',
          text: `Here are your 10 most recent tickets:\n\n${ticketList}\n\nPlease enter the ticket number you want to track.`,
        },
      ],
      quickReplies,
    };
  } catch (err: any) {
    console.error('🚨 Unexpected error retrieving user tickets:', err);
    return {
      messages: [
        {
          role: 'printy',
          text:
            'An unexpected error occurred while retrieving your tickets. Please try again later.',
        },
      ],
      quickReplies: nodeQuickReplies(NODES.no_ticket_number),
    };
  }
}


    // ====================
    // Handle "No Ticket Number" State Input (manual input)
    // ====================
    if (!selection && currentNodeId === 'no_ticket_number') {
      const ticketNumber = input.trim();

      if (ticketNumber) {
        currentNodeId = 'has_ticket_number';
        const node = NODES[currentNodeId];
        return {
          messages: nodeToMessages(node),
          quickReplies: nodeQuickReplies(node),
        };
      } else {
        return {
          messages: [
            {
              role: 'printy',
              text: 'Please enter a ticket number from the list above.',
            },
          ],
          quickReplies: nodeQuickReplies(NODES.no_ticket_number),
        };
      }
    }

    // ====================
    // Default Fallback Navigation
    // ====================
    if (!selection) {
      return {
        messages: [
          {
            role: 'printy',
            text: 'Please choose one of the available options.',
          },
        ],
        quickReplies: nodeQuickReplies(current),
      };
    }

    // ====================
    // Normal Node Navigation
    // ====================
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




