import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { supabase } from '../../../lib/supabase';
import { ChatDatabaseService } from '../../../features/chat/core/services/ChatDatabaseService';

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
let currentSessionId: string | null = null;

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
    return nodeToMessages(NODES[currentNodeId]);
  },
  quickReplies: () => nodeQuickReplies(NODES[currentNodeId]),
  respond: async (ctx, input) => {
    const current = NODES[currentNodeId];
    const selection = current.options.find(
      o => o.label.toLowerCase() === input.trim().toLowerCase()
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
            
            const conversationMessages: BotMessage[] = [
              { role: 'printy', text: '\n--- Conversation History ---' },
            ];
            
            if (messages && messages.length > 0) {
              messages.forEach((msg: any) => {
                const sender = msg.role === 'user' ? 'You' : 'Admin';
                const timestamp = new Date(msg.ts).toLocaleString();
                conversationMessages.push({
                  role: 'printy',
                  text: `[${timestamp}] ${sender}: ${msg.text}`,
                });
              });
            } else {
              conversationMessages.push({
                role: 'printy',
                text: 'No messages yet. Start the conversation below!',
              });
            }
            
            conversationMessages.push({
              role: 'printy',
              text: '--- End of History ---\n',
            });
            
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
            { role: 'printy', text: 'Your message has been sent to the admin team.' },
            { role: 'printy', text: 'They will respond as soon as possible.' },
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
      const inquiryId = input.trim().replace(/[^a-zA-Z0-9-]/g, ''); // sanitize input

      if (!inquiryId) {
        return {
          messages: [
            { role: 'printy', text: 'Please enter a valid ticket number (inquiry ID).' },
          ],
          quickReplies: nodeQuickReplies(NODES.has_ticket_number),
        };
      }

      const { data, error } = await supabase.rpc('api_inquiry_by_id', {
        p_inquiry_id: inquiryId,
      });
      const inquiry = ((data as any[]) || [])[0];

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

