/**
 * JSON Flow Action Handlers
 * All Supabase integrations for customer ticket flows
 */
import { supabase } from '../../../../lib/supabase';
import { getTurnstileToken } from '../../../../lib/turnstile';
import { ChatDatabaseService } from '../services/ChatDatabaseService';
import type { FlowContext, ActionResult, JsonNode } from '../../../../types/jsonFlow';

type ActionHandler = (
  context: FlowContext,
  config: Record<string, any>,
  node: JsonNode
) => Promise<ActionResult>;

// Profanity filter blacklist
const PROFANITY_BLACKLIST = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'nigger',
];

function checkProfanity(text: string): string | null {
  const lower = text.toLowerCase();
  return PROFANITY_BLACKLIST.find(word => lower.includes(word)) || null;
}

function sanitizeInput(input: string, mode: string): string {
  if (mode === 'alnumdash') {
    return input.trim().replace(/[^a-zA-Z0-9-]/g, '');
  }
  return input.trim();
}

export const JsonFlowActions: Record<string, ActionHandler> = {
  /**
   * Validate Ticket ID
   * Checks if a ticket exists for the current user
   */
  validate_ticket: async (context, config): Promise<ActionResult> => {
    const input = context.user_input || '';
    const ticketId = sanitizeInput(input, config.sanitize || 'none');

    if (!ticketId) {
      return {
        status: 'not_found',
        messages: ['Please enter a valid ticket number.'],
      };
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const customerId = userData?.user?.id;

      if (!customerId) {
        return {
          status: 'not_authenticated',
          messages: ['Please sign in to view your tickets.'],
        };
      }

      const { data: inquiry, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('customer_id', customerId)
        .eq('display_id', ticketId)
        .maybeSingle();

      if (error || !inquiry) {
        return {
          status: 'not_found',
          messages: [`No ticket found with number "${ticketId}".`],
        };
      }

      return {
        status: 'found',
        context: {
          ticket_id: ticketId,
          inquiry_id: inquiry.inquiry_id,
          ticket: inquiry,
        },
      };
    } catch (error) {
      console.error('Error validating ticket:', error);
      return {
        status: 'error',
        messages: ['Error checking ticket. Please try again.'],
      };
    }
  },

  /**
   * Display Ticket Details
   * Shows ticket information to the user
   */
  display_ticket_details: async (context, config, node): Promise<ActionResult> => {
    const ticket = context.ticket;

    if (!ticket) {
      return {
        status: 'not_found',
        messages: ['Ticket not found.'],
      };
    }

    const fields = config.fields || [
      'display_id',
      'inquiry_type',
      'inquiry_status',
      'received_at',
      'resolution_comments',
    ];

    const messages: string[] = [];

    if (fields.includes('display_id')) {
      messages.push(`Ticket ID: ${ticket.display_id || ticket.inquiry_id}`);
    }

    if (fields.includes('inquiry_type')) {
      messages.push(
        `Issue type: ${ticket.inquiry_type || '(not specified)'}`
      );
    }

    if (fields.includes('inquiry_status')) {
      messages.push(`Status: ${ticket.inquiry_status}`);
    }

    if (fields.includes('received_at')) {
      messages.push(
        `Received: ${new Date(ticket.received_at).toLocaleString()}`
      );
    }

    if (fields.includes('resolution_comments')) {
      messages.push(
        ticket.resolution_comments
          ? `Resolution: ${ticket.resolution_comments}`
          : 'Resolution: (not yet provided)'
      );
    }

    // Store inquiry_id in context for conversation loading
    return {
      status: 'displayed',
      messages,
      context: {
        inquiry_id: ticket.inquiry_id,
      },
    };
  },

  /**
   * Fetch Customer Tickets
   * Retrieves list of user's tickets
   */
  fetch_customer_tickets: async (context, config, node): Promise<ActionResult> => {
    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData?.user) {
        return {
          status: 'not_authenticated',
          messages: [],
        };
      }

      const { data: tickets, error } = await supabase
        .from('inquiries')
        .select('display_id, inquiry_status, received_at, inquiry_id')
        .eq('customer_id', userData.user.id)
        .order('received_at', { ascending: false })
        .limit(config.limit || 10);

      if (error) {
        console.error('Error fetching tickets:', error);
        return {
          status: 'error',
          messages: ['Error retrieving your tickets. Please try again later.'],
        };
      }

      if (!tickets || tickets.length === 0) {
        return {
          status: 'no_tickets',
          messages: [],
        };
      }

      const ticketList = tickets
        .map(
          t =>
            `- ${t.display_id || '(no ID)'} (${
              t.inquiry_status || 'No status'
            }) — Received: ${new Date(t.received_at).toLocaleDateString()}`
        )
        .join('\n');

      return {
        status: 'tickets_displayed',
        messages: [`Here are your recent tickets:\n\n${ticketList}`],
        context: {
          tickets_list: tickets,
        },
      };
    } catch (error) {
      console.error('Error fetching customer tickets:', error);
      return {
        status: 'error',
        messages: [
          'An unexpected error occurred while retrieving your tickets.',
        ],
      };
    }
  },

  /**
   * Load Ticket Conversation
   * Gets or creates chat session and loads message history
   */
  load_ticket_conversation: async (context, config): Promise<ActionResult> => {
    const inquiryId = context[config.inquiryIdKey || 'inquiry_id'];

    if (!inquiryId) {
      return {
        status: 'error',
        messages: ['Inquiry ID not found.'],
      };
    }

    try {
      // Get or create session
      const { data: sessionId, error } = await supabase.rpc(
        'api_get_or_create_inquiry_session',
        { p_inquiry_id: inquiryId }
      );

      if (error || !sessionId) {
        return {
          status: 'error',
          messages: ['Unable to load conversation history.'],
        };
      }

      // Fetch messages
      const messages = await ChatDatabaseService.fetchSessionMessages(
        sessionId
      );

      let conversationText = 'Conversation History:\n\n';

      if (messages && messages.length > 0) {
        const messageTexts = messages.map((msg: any) => {
          const sender = msg.role === 'user' ? 'You' : 'Admin';
          const timestamp = new Date(msg.ts).toLocaleString();
          return `[${timestamp}] ${sender}: ${msg.text}`;
        });
        conversationText += messageTexts.join('\n');
      } else {
        conversationText +=
          'No messages yet. Start the conversation below!';
      }

      return {
        status: 'loaded',
        messages: [conversationText],
        context: {
          session_id: sessionId,
        },
      };
    } catch (error) {
      console.error('Error loading ticket conversation:', error);
      return {
        status: 'error',
        messages: ['Failed to load conversation.'],
      };
    }
  },

  /**
   * Send Ticket Reply
   * Saves customer message to chat session
   */
  send_ticket_reply: async (context, config): Promise<ActionResult> => {
    const sessionId = context[config.sessionIdKey || 'session_id'];
    const message = context[config.messageKey || 'user_input'];

    if (!sessionId || !message) {
      return {
        status: 'error',
        messages: ['Please enter a message to send.'],
      };
    }

    try {
      await ChatDatabaseService.insertMessage({
        sessionId,
        text: message,
        role: config.role || 'user',
      });

      return {
        status: 'sent',
      };
    } catch (error) {
      console.error('Error sending ticket reply:', error);
      return {
        status: 'error',
        messages: ['Failed to send message.'],
      };
    }
  },

  /**
   * Validate Order
   * Checks if an order exists for the current user
   */
  validate_order: async (context, config): Promise<ActionResult> => {
    const input = context.user_input || '';

    // Profanity check
    if (config.profanityCheck) {
      const flaggedWord = checkProfanity(input);
      if (flaggedWord) {
        return {
          status: 'profanity_detected',
          context: { flagged_word: flaggedWord },
        };
      }
    }

    const orderNumber = sanitizeInput(input, config.sanitize || 'none');

    if (!orderNumber) {
      return {
        status: 'order_not_found',
        messages: ['Please enter a valid order number.'],
      };
    }

    if (config.requireAuth) {
      const { data: userData } = await supabase.auth.getUser();
      const customerId = userData?.user?.id;

      if (!customerId) {
        return {
          status: 'not_authenticated',
          messages: [],
        };
      }

      const { data: order, error } = await supabase
        .from('orders')
        .select('order_id, order_status, order_datetime')
        .eq('order_id', orderNumber)
        .eq('customer_id', customerId)
        .maybeSingle();

      if (error || !order) {
        return {
          status: 'order_not_found',
          messages: [`Order "${orderNumber}" not found.`],
        };
      }

      return {
        status: 'order_found',
        context: {
          order_number: orderNumber,
          order_id: order.order_id,
          order: order,
        },
      };
    }

    return {
      status: 'order_found',
      context: { order_number: orderNumber },
    };
  },

  /**
   * Display Order Details
   * Shows order information to the user
   */
  display_order_details: async (context, config, node): Promise<ActionResult> => {
    const order = context.order;

    if (!order) {
      return {
        status: 'not_found',
        messages: ['Order not found.'],
      };
    }

    const messages: string[] = [];

    if (config.fields.includes('order_id')) {
      messages.push(`Order ${order.order_id}`);
    }

    if (config.fields.includes('order_status')) {
      messages.push(`Status: ${order.order_status ?? 'N/A'}`);
    }

    if (config.fields.includes('order_datetime')) {
      messages.push(
        `Placed: ${
          order.order_datetime
            ? new Date(order.order_datetime).toLocaleString()
            : 'N/A'
        }`
      );
    }

    return {
      status: 'displayed',
      messages,
    };
  },

  /**
   * Collect Issue Details
   * Accumulates user's issue description with profanity check
   * This runs AFTER user provides input
   */
  collect_issue_details: async (context, config): Promise<ActionResult> => {
    const input = context.user_input || '';

    // If no input yet, just set the inquiry type and wait
    if (!input || input.trim() === '') {
      const inquiryType = config.inquiry_type || 'other';
      return {
        status: 'awaiting_input',
        context: {
          inquiry_type: inquiryType,
        },
      };
    }

    // Profanity check
    if (config.profanityCheck) {
      const flaggedWord = checkProfanity(input);
      if (flaggedWord) {
        return {
          status: 'profanity_detected',
          context: { flagged_word: flaggedWord },
        };
      }
    }

    const detail = input.trim();

    // Append or replace details
    const existingDetails = context[config.detailsKey || 'issue_details'] || '';
    const newDetails = config.append
      ? existingDetails
        ? `${existingDetails}\n${detail}`
        : detail
      : detail;

    // Set inquiry type
    const inquiryType = config.inquiry_type || 'other';

    return {
      status: 'details_collected',
      messages: [
        "Got it. I've added that to your ticket notes. Add more details or choose 'Submit ticket' when ready.",
      ],
      context: {
        [config.detailsKey || 'issue_details']: newDetails,
        inquiry_type: inquiryType,
      },
    };
  },

  /**
   * Create Inquiry with Turnstile
   * Creates a new ticket in the database with Turnstile verification
   */
  create_inquiry_with_turnstile: async (context, config): Promise<ActionResult> => {
    const message =
      context[config.messageKey || 'issue_details'] ||
      '(no details provided)';
    const inquiryType = context[config.inquiryTypeKey || 'inquiry_type'] || 'other';

    try {
      const token = await getTurnstileToken(
        config.turnstileAction || 'issue_ticket_submit'
      );

      const { data, error } = await supabase.functions.invoke(
        'create-inquiry-with-turnstile',
        {
          body: {
            token,
            message,
            inquiry_type: inquiryType,
          },
        }
      );

      if (error || !data?.ok) {
        console.error('Error creating inquiry:', error);
        return {
          status: 'error',
          messages: [],
        };
      }

      const displayId = data?.display_id || '(unknown ticket number)';

      return {
        status: 'success',
        messages: [`Your ticket number is: ${displayId}`],
        context: {
          ticket_display_id: displayId,
          ticket_id: data?.inquiry_id,
        },
      };
    } catch (error) {
      console.error('Error creating inquiry:', error);
      return {
        status: 'error',
        messages: [],
      };
    }
  },
};
