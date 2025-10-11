// Refactored Tickets Flow using shared utilities and base framework

import type { BotMessage } from '../../../types/chatFlow';
import {
  FlowBase,
  TICKET_STATUS_OPTIONS,
  createStatusChangeMessage,
  createTicketReplyMessage,
} from '../shared';
import { normalizeTicketStatus } from '../shared/utils/StatusNormalizers';
import type { FlowState, FlowContext, NodeHandler } from '../shared';
// extractTicketIds import removed - no longer needed for single ticket flow
// ChatDatabaseService import removed - data is now fetched by useAdminChat and passed via context

type TicketNodeId =
  | 'ticket_overview'
  | 'choose_status'
  | 'reply'
  | 'done';

interface TicketsState extends FlowState {
  currentNodeId: TicketNodeId;
  currentTicketId: string | null;
  currentTickets: any[];
}

class TicketsFlow extends FlowBase {
  id = 'admin-tickets';
  title = 'Admin Tickets';

  constructor() {
    super({
      currentNodeId: 'ticket_overview',
      currentTicketId: null,
      currentTickets: [],
    });
    this.registerNodes();
  }

  protected initializeState(context: FlowContext): void {
    this.state.currentTicketId =
      (context?.ticketId as string) || (context?.orderId as string) || null;
    this.state.currentTickets =
      (context?.tickets as any[]) || (context?.orders as any[]) || [];
    // Always start with ticket_overview since this flow is for single ticket context
    this.state.currentNodeId = 'ticket_overview';
  }

  private registerNodes(): void {
    // Ticket overview node (main entry point for single ticket)
    this.registerNode('ticket_overview', this.createTicketOverviewNode());

    // Status change node
    this.registerNode('choose_status', this.createStatusChangeNode());

    // Reply node
    this.registerNode('reply', this.createReplyNode());

    // Done node
    this.registerNode('done', this.createDoneNode());
  }


  private createTicketOverviewNode(): NodeHandler {
    return {
      messages: (state: FlowState, context: FlowContext) => {
        const ticketState = state as TicketsState;
        const ticketId = ticketState.currentTicketId;
        if (!ticketId) return [{ role: 'printy', text: 'No ticket selected.' }];

        // Get inquiry data from context (fetched by useAdminChat)
        const inquiry = (context as any)?.inquiry;
        
        // If no inquiry data yet, try to find it in the context tickets
        let inquiryData = inquiry;
        if (!inquiryData && context?.tickets) {
          inquiryData = context.tickets.find((t: any) => t.inquiry_id === ticketId);
        }
        
        if (!inquiryData) {
          // Fallback to mock data or basic display
          const ticket = this.getCurrentTicket(ticketState);
          if (!ticket) return [{ role: 'printy', text: `Ticket ${ticketId} not found.` }];

          const msgs: BotMessage[] = [
            { role: 'printy', text: `Viewing ${ticket.id}` },
            { role: 'printy', text: `Subject: ${ticket.subject}` },
          ];

          if (ticket.description) {
            msgs.push({
              role: 'printy',
              text: `Description: ${ticket.description}`,
            });
          }

          msgs.push(
            { role: 'printy', text: `From: ${ticket.requester || 'Customer'}` },
            { role: 'printy', text: `Status: ${ticket.status}` },
            {
              role: 'printy',
              text: `Last message: ${ticket.lastMessage || ticket.description || '—'}`,
            },
            { role: 'printy', text: 'What would you like to do?' }
          );

          return msgs;
        }

        // Display real inquiry data from database
        const msgs: BotMessage[] = [
          { role: 'printy', text: `Viewing ${inquiryData.inquiry_id}` },
          { role: 'printy', text: `Subject: ${inquiryData.inquiry_type || 'General Inquiry'}` },
        ];

        // Display customer's original message
        if (inquiryData.inquiry_message) {
          msgs.push({
            role: 'printy',
            text: `Description: ${inquiryData.inquiry_message}`,
          });
        }

        msgs.push(
          { role: 'printy', text: `From: ${inquiryData.customer_full_name || 'Customer'}` },
          { role: 'printy', text: `Status: ${inquiryData.inquiry_status}` }
        );

        // Display resolution comments if any
        if (inquiryData.resolution_comments) {
          msgs.push({
            role: 'printy',
            text: `Last message: ${inquiryData.resolution_comments}`,
          });
        } else if (inquiryData.inquiry_message) {
          msgs.push({
            role: 'printy',
            text: `Last message: ${inquiryData.inquiry_message}`,
          });
        } else {
          msgs.push({
            role: 'printy',
            text: `Last message: —`,
          });
        }

        // Display conversation history if available
        const chatHistory = (context as any)?.chatHistory;
        if (chatHistory && chatHistory.length > 0) {
          msgs.push({ role: 'printy', text: '\n--- Conversation History ---' });
          
          // Display ALL messages from conversation history
          chatHistory.forEach((msg: any) => {
            const sender = msg.role === 'user' ? 'Customer' : 'Admin';
            const timestamp = new Date(msg.ts).toLocaleString();
            msgs.push({
              role: 'printy',
              text: `[${timestamp}] ${sender}: ${msg.text}`,
            });
          });
          
          msgs.push({ role: 'printy', text: '--- End of History ---\n' });
        }

        msgs.push({ role: 'printy', text: '\nWhat would you like to do?' });

        return msgs;
      },
      quickReplies: () => ['Reply', 'Change Status', 'End Chat'],
      handleInput: (
        input: string,
        _state: FlowState,
        _context: FlowContext
      ) => {
        const lower = input.toLowerCase();

        if (lower === 'reply') {
          return { nextNodeId: 'reply' };
        }

        if (lower === 'change status' || lower === 'status') {
          return { nextNodeId: 'choose_status' };
        }

        return null;
      },
    };
  }

  private createStatusChangeNode(): NodeHandler {
    return {
      messages: (state: FlowState, _context: FlowContext) => {
        const ticketState = state as TicketsState;
        const ticket = this.getCurrentTicket(ticketState);
        if (!ticket) return [{ role: 'printy', text: 'Ticket not found.' }];
        return [
          {
            role: 'printy',
            text: `What status would you like to set for ${ticket.id}?`,
          },
        ];
      },
      quickReplies: () => ['Back', ...TICKET_STATUS_OPTIONS, 'End Chat'],
      handleInput: (input: string, state: FlowState, _context: FlowContext) => {
        const ticketState = state as TicketsState;
        const ticket = this.getCurrentTicket(ticketState);
        if (!ticket) {
          return {
            messages: [{ role: 'printy', text: 'Ticket not found.' }],
            quickReplies: ['End Chat'],
          };
        }

        if (input.trim().toLowerCase() === 'back') {
          return { nextNodeId: 'ticket_overview' };
        }

        const next = normalizeTicketStatus(input);

        if (!next) {
          return {
            messages: [
              {
                role: 'printy',
                text: `Valid statuses: ${TICKET_STATUS_OPTIONS.join(', ')}`,
              },
            ],
            quickReplies: ['Back', ...TICKET_STATUS_OPTIONS, 'End Chat'],
          };
        }

        const prev = ticket.status;
        this.updateTicket(ticket.id, { status: next }, ticketState);

        return {
          nextNodeId: 'ticket_overview',
          messages: [createStatusChangeMessage(ticket.id, prev, next)],
        };
      },
    };
  }

  private createReplyNode(): NodeHandler {
    return {
      messages: (_state: FlowState, _context: FlowContext) => {
        return [
          {
            role: 'printy',
            text: 'Type your reply message to send to the user.',
          },
        ];
      },
      quickReplies: () => ['End Chat'],
      handleInput: (input: string, state: FlowState, _context: FlowContext) => {
        const ticketState = state as TicketsState;
        const ticket = this.getCurrentTicket(ticketState);
        if (!ticket) {
          return {
            messages: [{ role: 'printy', text: 'Ticket not found.' }],
            quickReplies: ['End Chat'],
          };
        }

        const body = input.trim();
        if (!body) {
          return {
            messages: [
              { role: 'printy', text: 'Please type a reply message.' },
            ],
            quickReplies: ['End Chat'],
          };
        }

        this.updateTicket(ticket.id, { lastMessage: body }, ticketState);

        return {
          nextNodeId: 'ticket_overview',
          messages: [createTicketReplyMessage(ticket.id)],
        };
      },
    };
  }

  private createDoneNode(): NodeHandler {
    return {
      messages: () => [
        { role: 'printy', text: 'Ticket updated. Anything else?' },
      ],
      quickReplies: () => ['Reply', 'Change Status', 'End Chat'],
    };
  }

  private getCurrentTicket(state: TicketsState): any {
    if (!state.currentTicketId) return null;
    return this.findTicket(state.currentTicketId, state);
  }

  private findTicket(id: string, state: TicketsState): any {
    const up = id.toUpperCase();
    return state.currentTickets.find(t => (t.id || '').toUpperCase() === up);
  }

  private updateTicket(
    ticketId: string,
    updates: Partial<any>,
    state: TicketsState
  ): void {
    // Update via context if available
    if (this.context.updateTicket) {
      this.context.updateTicket(ticketId, updates);
    }

    // Update local state
    state.currentTickets = state.currentTickets.map(t =>
      t.id === ticketId ? { ...t, ...updates } : t
    );

    // Refresh if available
    if (this.context.refreshTickets) {
      this.context.refreshTickets();
    }
  }
}

export const ticketsFlow = new TicketsFlow();
