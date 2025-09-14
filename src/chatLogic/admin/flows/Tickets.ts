// Refactored Tickets Flow using shared utilities and base framework

import type { BotMessage } from '../../../types/chatFlow';
import { mockTickets } from '../../../data/tickets';
import {
  FlowBase,
  TICKET_STATUS_OPTIONS,
  createStatusChangeMessage,
  createTicketReplyMessage,
} from '../shared';
import { normalizeTicketStatus } from '../shared/utils/StatusNormalizers';
import type { FlowState, FlowContext, NodeHandler } from '../shared';
import { extractTicketIds } from '../shared/utils/IdExtractors';

type TicketNodeId =
  | 'action'
  | 'choose_ticket'
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
      currentNodeId: 'action',
      currentTicketId: null,
      currentTickets: [],
    });
    this.registerNodes();
  }

  protected initializeState(context: FlowContext): void {
    this.state.currentTicketId =
      (context?.ticketId as string) || (context?.orderId as string) || null;
    this.state.currentTickets =
      (context?.tickets as any[]) || (context?.orders as any[]) || mockTickets;
    this.state.currentNodeId = this.state.currentTicketId
      ? 'ticket_overview'
      : 'action';
  }

  private registerNodes(): void {
    // Action node
    this.registerNode('action', this.createActionNode());

    // Choose ticket node
    this.registerNode('choose_ticket', this.createChooseTicketNode());

    // Ticket overview node
    this.registerNode('ticket_overview', this.createTicketOverviewNode());

    // Status change node
    this.registerNode('choose_status', this.createStatusChangeNode());

    // Reply node
    this.registerNode('reply', this.createReplyNode());

    // Done node
    this.registerNode('done', this.createDoneNode());
  }

  private createActionNode(): NodeHandler {
    return {
      messages: (state: FlowState, _context: FlowContext) => {
        const ticketState = state as TicketsState;
        const ticket = this.getCurrentTicket(ticketState);
        if (ticket) {
          return [
            {
              role: 'printy',
              text: `Looking at ticket ${ticket.id} - ${ticket.subject}. Current status: ${ticket.status}. What would you like to do?`,
            },
          ];
        }
        return [
          {
            role: 'printy',
            text: 'Tickets assistant ready. Choose a ticket to manage.',
          },
        ];
      },
      quickReplies: (state: FlowState, _context: FlowContext) => {
        const ticketState = state as TicketsState;
        const ticket = this.getCurrentTicket(ticketState);
        return ticket
          ? ['View Details', 'Reply', 'Change Status', 'End Chat']
          : ['Choose Ticket', 'End Chat'];
      },
      handleInput: (
        input: string,
        _state: FlowState,
        _context: FlowContext
      ) => {
        const lower = input.toLowerCase();

        if (lower === 'choose ticket' || lower === 'choose') {
          return { nextNodeId: 'choose_ticket' };
        }

        if (lower === 'view details' || lower === 'details') {
          return { nextNodeId: 'ticket_overview' };
        }

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

  private createChooseTicketNode(): NodeHandler {
    return {
      messages: (state: FlowState, _context: FlowContext) => {
        const ticketState = state as TicketsState;
        const msgs: BotMessage[] = [
          { role: 'printy', text: 'Please select a ticket to view.' },
        ];
        ticketState.currentTickets.slice(0, 5).forEach(ticket => {
          msgs.push({
            role: 'printy',
            text: `${ticket.id} • ${ticket.subject} • ${ticket.status}`,
          });
        });
        return msgs;
      },
      quickReplies: (state: FlowState, _context: FlowContext) => {
        const ticketState = state as TicketsState;
        const firstFive = ticketState.currentTickets.slice(0, 5).map(t => t.id);
        return [...firstFive, 'End Chat'];
      },
      handleInput: (input: string, state: FlowState, _context: FlowContext) => {
        const ticketState = state as TicketsState;
        const ids = extractTicketIds(input);
        const pick =
          ids[0] ||
          ticketState.currentTickets
            .map(t => t.id.toLowerCase())
            .find(id => id === input.toLowerCase()) ||
          null;
        const chosen = pick ? this.findTicket(pick, ticketState) : null;

        if (!chosen) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'Please choose a ticket from the list or type its ID (e.g., TCK-2981).',
              },
            ],
            quickReplies: ticketState.currentTickets
              .slice(0, 5)
              .map(t => t.id)
              .concat(['End Chat']),
          };
        }

        return {
          nextNodeId: 'ticket_overview',
          stateUpdates: { currentTicketId: chosen.id },
        };
      },
    };
  }

  private createTicketOverviewNode(): NodeHandler {
    return {
      messages: (state: FlowState, _context: FlowContext) => {
        const ticketState = state as TicketsState;
        const ticket = this.getCurrentTicket(ticketState);
        if (!ticket) return [{ role: 'printy', text: 'Ticket not found.' }];

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
      },
      quickReplies: () => [
        'Reply',
        'Change Status',
        'Choose Another Ticket',
        'End Chat',
      ],
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

        if (lower === 'choose another ticket' || lower === 'choose ticket') {
          return { nextNodeId: 'choose_ticket' };
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
      quickReplies: () => [...TICKET_STATUS_OPTIONS, 'End Chat'],
      handleInput: (input: string, state: FlowState, _context: FlowContext) => {
        const ticketState = state as TicketsState;
        const ticket = this.getCurrentTicket(ticketState);
        if (!ticket) {
          return {
            messages: [{ role: 'printy', text: 'Ticket not found.' }],
            quickReplies: ['End Chat'],
          };
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
            quickReplies: [...TICKET_STATUS_OPTIONS, 'End Chat'],
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
      quickReplies: () => [
        'Reply',
        'Change Status',
        'Choose Another Ticket',
        'End Chat',
      ],
    };
  }

  private getCurrentTicket(state: TicketsState): any {
    if (!state.currentTicketId) return null;
    return this.findTicket(state.currentTicketId, state);
  }

  private findTicket(id: string, state: TicketsState): any {
    const up = id.toUpperCase();
    return (
      state.currentTickets.find(t => (t.id || '').toUpperCase() === up) ||
      mockTickets.find(t => (t.id || '').toUpperCase() === up)
    );
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

    // Update mock data
    const mi = mockTickets.findIndex(t => t.id === ticketId);
    if (mi !== -1) {
      mockTickets[mi] = { ...mockTickets[mi], ...updates };
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
