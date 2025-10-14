import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { supabase } from '../../../lib/supabase';
import { ChatDatabaseService } from '../../../features/chat/core/services/ChatDatabaseService';

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

  view_ticket_conversation: {
    id: 'view_ticket_conversation',
    message: 'Here is your ticket conversation:',
    options: [
      { label: 'Reply to ticket', next: 'reply_to_ticket' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  reply_to_ticket: {
    id: 'reply_to_ticket',
    question: 'Reply to Ticket',
    answer: 'Type your message to reply to this ticket:',
    options: [
      { label: 'Send another message', next: 'reply_to_ticket' },
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
let currentSessionId: string | null = null;

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
  initial: (ctx) => {
    // Check if we have an inquiry_id in context (from Track Ticket button)
    const inquiryId = (ctx as any)?.inquiryId;
    const subject = (ctx as any)?.subject;
    
    if (inquiryId) {
      // Direct to conversation view for existing ticket
      currentNodeId = 'view_ticket_conversation';
      return [
        { role: 'printy', text: `Ticket: ${subject || 'Support Request'}` },
        { role: 'printy', text: `Ticket ID: ${inquiryId}` },
        { role: 'printy', text: 'Loading conversation history...' },
      ];
    }
    
    // Default flow for manual ticket tracking
    currentNodeId = 'track_ticket_start';
    awaitingTicketInput = false;
    return nodeToMessages(NODES[currentNodeId]);
  },

  quickReplies: () => nodeQuickReplies(NODES[currentNodeId]),
  respond: async (ctx, input) => {
    const current = NODES[currentNodeId];
    const selection = current.options.find(
      (o) => o.label.toLowerCase() === input.trim().toLowerCase()
    );

    // ====================
    // Handle Conversation Loading (first interaction)
    // ====================
    if (currentNodeId === 'view_ticket_conversation' && !currentSessionId) {
      const inquiryId = (ctx as any)?.inquiryId;
      
      if (inquiryId) {
        try {
          // Get or create chat session for this inquiry
          const { data: sessionId, error } = await supabase.rpc(
            'api_get_or_create_inquiry_session',
            { p_inquiry_id: inquiryId }
          );
          
          if (!error && sessionId) {
            currentSessionId = sessionId;
            
            // Fetch existing messages
            const messages = await ChatDatabaseService.fetchSessionMessages(sessionId);
            
            let conversationText = 'Conversation History:\n\n';
            
            if (messages && messages.length > 0) {
              const messageTexts = messages.map((msg: any) => {
                const sender = msg.role === 'user' ? 'You' : 'Admin';
                const timestamp = new Date(msg.ts).toLocaleString();
                return `[${timestamp}] ${sender}: ${msg.text}`;
              });
              conversationText += messageTexts.join('\n');
            } else {
              conversationText += 'No messages yet. Start the conversation below!';
            }
            
            const conversationMessages: BotMessage[] = [
              { role: 'printy', text: conversationText },
            ];
            
            return {
              messages: conversationMessages,
              quickReplies: nodeQuickReplies(NODES.view_ticket_conversation),
            };
          }
        } catch (error) {
          console.error('Failed to load ticket conversation:', error);
        }
        
        // Fallback if session loading fails
        return {
          messages: [
            { role: 'printy', text: 'Unable to load conversation history. You can still reply to this ticket.' },
          ],
          quickReplies: nodeQuickReplies(NODES.view_ticket_conversation),
        };
      }
    }

    // ====================
    // Handle Reply to Ticket
    // ====================
    if (!selection && currentNodeId === 'reply_to_ticket' && currentSessionId) {
      const message = input.trim();
      if (!message) {
        return {
          messages: [
            { role: 'printy', text: 'Please enter a message to send.' },
          ],
          quickReplies: nodeQuickReplies(NODES.reply_to_ticket),
        };
      }

      try {
        // Save customer message to database
        await ChatDatabaseService.insertMessage({
          sessionId: currentSessionId,
          text: message,
          role: 'user',
        });

        return {
          messages: [
            { role: 'printy', text: 'Your message has been sent to the admin team.\n\nThey will respond as soon as possible.' },
          ],
          quickReplies: nodeQuickReplies(NODES.reply_to_ticket),
        };
      } catch (error) {
        console.error('Failed to send message:', error);
        return {
          messages: [
            { role: 'printy', text: 'Failed to send message. Please try again.' },
          ],
          quickReplies: nodeQuickReplies(NODES.reply_to_ticket),
        };
      }
    }

    // ====================
    // Handle Ticket Status Inquiry (manual entry)
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

      const lines = [
        `📌 Ticket ID: ${inquiry.display_id || inquiry.inquiry_id}`,
        `📝 Issue submitted: ${inquiry.inquiry_message || '(no message provided)'}`,
        `📂 Issue type: ${inquiry.inquiry_type || '(not specified)'}`,
        `📅 Received: ${new Date(inquiry.received_at).toLocaleString()}`,
        `📊 Status: ${inquiry.inquiry_status}`,
        inquiry.resolution_comments
          ? `✅ Resolution: ${inquiry.resolution_comments}`
          : '✅ Resolution: (not yet provided)',
      ];

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




