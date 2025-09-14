// Refactored MultipleTickets Flow using shared utilities and base framework

import type { BotMessage } from '../../../types/chatFlow';
import { mockTickets } from '../../../data/tickets';
import {
  FlowBase,
  TICKET_STATUS_OPTIONS,
  createStatusChangeMessage,
  createSelectionListMessage,
} from '../shared';
import { normalizeTicketStatus } from '../shared/utils/StatusNormalizers';
import type { FlowState, FlowContext, NodeHandler } from '../shared';
import { extractTicketIds } from '../shared/utils/IdExtractors';

type MultipleTicketsNodeId =
  | 'multi_start'
  | 'action'
  | 'choose_id'
  | 'choose_status'
  | 'choose_bulk_status'
  | 'reply'
  | 'choose_reply_target'
  | 'done';

interface MultipleTicketsState extends FlowState {
  currentNodeId: MultipleTicketsNodeId;
  selectedIds: string[];
  ticketsRef: any[];
  currentTargetId: string | null;
  changedIds: Set<string>;
  repliedIds: Set<string>;
}

class MultipleTicketsFlow extends FlowBase {
  id = 'admin-multiple-tickets';
  title = 'Admin Multiple Tickets';

  constructor() {
    super({
      currentNodeId: 'multi_start',
      selectedIds: [],
      ticketsRef: [],
      currentTargetId: null,
      changedIds: new Set(),
      repliedIds: new Set(),
    });
    this.registerNodes();
  }

  protected initializeState(context: FlowContext): void {
    this.state.selectedIds = Array.isArray(context?.ticketIds)
      ? (context?.ticketIds as string[]).map(x => x.toUpperCase())
      : [];
    this.state.ticketsRef = (context?.tickets as any[]) || mockTickets;
    this.state.changedIds = new Set<string>();
    this.state.repliedIds = new Set<string>();
    this.state.currentTargetId = null;
    this.state.currentNodeId =
      this.state.selectedIds.length > 1 ? 'multi_start' : 'action';
  }

  private registerNodes(): void {
    // Multi start node
    this.registerNode('multi_start', this.createMultiStartNode());

    // Action node
    this.registerNode('action', this.createActionNode());

    // Choose ID node
    this.registerNode('choose_id', this.createChooseIdNode());

    // Status change node
    this.registerNode('choose_status', this.createStatusChangeNode());

    // Bulk status change node
    this.registerNode('choose_bulk_status', this.createBulkStatusChangeNode());

    // Reply node
    this.registerNode('reply', this.createReplyNode());

    // Choose reply target node
    this.registerNode(
      'choose_reply_target',
      this.createChooseReplyTargetNode()
    );

    // Done node
    this.registerNode('done', this.createDoneNode());
  }

  private createMultiStartNode(): NodeHandler {
    return {
      messages: (state: FlowState, _context: FlowContext) => {
        const ticketState = state as MultipleTicketsState;
        const selected = this.getSelectedTickets(ticketState);
        const msgs: BotMessage[] = [
          {
            role: 'printy',
            text: `Multiple tickets assistant ready (${selected.length} selected).`,
          },
          { role: 'printy', text: 'You selected:' },
        ];
        msgs.push(...createSelectionListMessage(selected, 'ticket'));
        msgs.push({
          role: 'printy',
          text: 'What do you want to do with these tickets?',
        });
        return msgs;
      },
      quickReplies: () => ['Change Status', 'Reply to Ticket', 'End Chat'],
      handleInput: (
        input: string,
        _state: FlowState,
        _context: FlowContext
      ) => {
        const lower = input.toLowerCase();

        if (lower === 'change status') {
          return { nextNodeId: 'choose_id' };
        }

        if (lower.includes('reply') || lower === 'reply to ticket') {
          return { nextNodeId: 'choose_reply_target' };
        }

        return null;
      },
    };
  }

  private createActionNode(): NodeHandler {
    return {
      messages: (state: FlowState, _context: FlowContext) => {
        const ticketState = state as MultipleTicketsState;
        return [
          {
            role: 'printy',
            text: `You selected ${ticketState.selectedIds.length} tickets. What do you want to do with these tickets?`,
          },
        ];
      },
      quickReplies: () => ['Change Status', 'Reply to Ticket', 'End Chat'],
      handleInput: (
        input: string,
        _state: FlowState,
        _context: FlowContext
      ) => {
        const lower = input.toLowerCase();

        if (lower === 'change status') {
          return { nextNodeId: 'choose_id' };
        }

        if (lower.includes('reply') || lower === 'reply to ticket') {
          return { nextNodeId: 'choose_reply_target' };
        }

        return null;
      },
    };
  }

  private createChooseIdNode(): NodeHandler {
    return {
      messages: (_state: FlowState, _context: FlowContext) => {
        return [
          { role: 'printy', text: 'Which ticket ID would you like to change?' },
        ];
      },
      quickReplies: (state: FlowState, _context: FlowContext) => {
        const ticketState = state as MultipleTicketsState;
        const remaining = this.getRemainingTickets(ticketState);
        return [
          ...remaining.map(t => t.id),
          'Change to All in One instead',
          'End Chat',
        ];
      },
      handleInput: (input: string, state: FlowState, _context: FlowContext) => {
        const ticketState = state as MultipleTicketsState;
        const lower = input.toLowerCase();

        if (lower === 'change to all in one instead') {
          return { nextNodeId: 'choose_bulk_status' };
        }

        const remaining = this.getRemainingTickets(ticketState);
        const ids = extractTicketIds(input);
        const pick =
          ids[0] || remaining.find(t => t.id.toLowerCase() === lower)?.id;

        if (!pick || !remaining.find(t => t.id === pick)) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'Please pick one of the selected ticket IDs.',
              },
            ],
            quickReplies: [
              ...remaining.map(t => t.id),
              'Change to All in One instead',
              'End Chat',
            ],
          };
        }

        return {
          nextNodeId: 'choose_status',
          stateUpdates: { currentTargetId: pick },
        };
      },
    };
  }

  private createStatusChangeNode(): NodeHandler {
    return {
      messages: (state: FlowState, _context: FlowContext) => {
        const ticketState = state as MultipleTicketsState;
        const ticket = this.getCurrentTicket(ticketState);
        if (!ticket) return [{ role: 'printy', text: 'Ticket not found.' }];
        return [
          {
            role: 'printy',
            text: `Current status of ${ticket.id} is ${ticket.status}. Choose new status.`,
          },
        ];
      },
      quickReplies: () => [...TICKET_STATUS_OPTIONS, 'End Chat'],
      handleInput: (input: string, state: FlowState, _context: FlowContext) => {
        const ticketState = state as MultipleTicketsState;
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
                text: `What status should I set for ${ticket.id}?`,
              },
            ],
            quickReplies: [...TICKET_STATUS_OPTIONS, 'End Chat'],
          };
        }

        const prev = ticket.status;
        this.updateTicket(ticket.id, { status: next }, ticketState);

        const changedIds = new Set(ticketState.changedIds);
        changedIds.add(ticket.id);

        const remaining = this.getRemainingTickets({
          ...ticketState,
          changedIds,
        });
        const msgs: BotMessage[] = [
          createStatusChangeMessage(ticket.id, prev, next),
        ];

        if (remaining.length > 1) {
          return {
            nextNodeId: 'choose_id',
            stateUpdates: { changedIds, currentTargetId: null },
            messages: [
              ...msgs,
              { role: 'printy', text: 'Pick another ticket to update.' },
            ],
          };
        }

        if (remaining.length === 1) {
          return {
            nextNodeId: 'choose_status',
            stateUpdates: { changedIds, currentTargetId: remaining[0].id },
            messages: msgs,
          };
        }

        return {
          nextNodeId: 'done',
          stateUpdates: { changedIds, currentTargetId: null },
          messages: msgs,
        };
      },
    };
  }

  private createBulkStatusChangeNode(): NodeHandler {
    return {
      messages: (_state: FlowState, _context: FlowContext) => {
        return [
          {
            role: 'printy',
            text: 'Okay, apply one status to all selected. What status?',
          },
        ];
      },
      quickReplies: () => [...TICKET_STATUS_OPTIONS, 'End Chat'],
      handleInput: (input: string, state: FlowState, _context: FlowContext) => {
        const ticketState = state as MultipleTicketsState;
        const next = normalizeTicketStatus(input);

        if (!next) {
          return {
            messages: [
              { role: 'printy', text: 'Please choose a valid status.' },
            ],
            quickReplies: [...TICKET_STATUS_OPTIONS, 'End Chat'],
          };
        }

        const selected = this.getSelectedTickets(ticketState);
        const msgs: BotMessage[] = [
          {
            role: 'printy',
            text: `✅ Applying ${next} to ${selected.length} ticket(s):`,
          },
        ];

        selected.forEach(ticket => {
          const prev = ticket.status;
          this.updateTicket(ticket.id, { status: next }, ticketState);
          msgs.push({
            role: 'printy',
            text: `${ticket.id}: ${prev} → ${next}`,
          });
        });

        return {
          nextNodeId: 'done',
          stateUpdates: { changedIds: new Set(ticketState.selectedIds) },
          messages: msgs,
        };
      },
    };
  }

  private createChooseReplyTargetNode(): NodeHandler {
    return {
      messages: (_state: FlowState, _context: FlowContext) => {
        return [
          {
            role: 'printy',
            text: 'Which ticket ID would you like to reply to?',
          },
        ];
      },
      quickReplies: (state: FlowState, _context: FlowContext) => {
        const ticketState = state as MultipleTicketsState;
        const remaining = this.getRemainingReplyTickets(ticketState);
        return [...remaining.map(t => t.id), 'End Chat'];
      },
      handleInput: (input: string, state: FlowState, _context: FlowContext) => {
        const ticketState = state as MultipleTicketsState;
        const remaining = this.getRemainingReplyTickets(ticketState);
        const ids = extractTicketIds(input);
        const pick =
          ids[0] ||
          remaining.find(t => t.id.toLowerCase() === input.toLowerCase())?.id;

        if (!pick || !remaining.find(t => t.id === pick)) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'Please pick one of the selected ticket IDs.',
              },
            ],
            quickReplies: [...remaining.map(t => t.id), 'End Chat'],
          };
        }

        return {
          nextNodeId: 'reply',
          stateUpdates: { currentTargetId: pick },
        };
      },
    };
  }

  private createReplyNode(): NodeHandler {
    return {
      messages: (state: FlowState, _context: FlowContext) => {
        const ticketState = state as MultipleTicketsState;
        const ticket = this.getCurrentTicket(ticketState);
        if (!ticket) return [{ role: 'printy', text: 'Ticket not found.' }];
        return [
          {
            role: 'printy',
            text: `Replying to ${ticket.id} - ${ticket.subject}.`,
          },
          {
            role: 'printy',
            text: 'Type your reply message to send to the user.',
          },
        ];
      },
      quickReplies: () => ['End Chat'],
      handleInput: (input: string, state: FlowState, _context: FlowContext) => {
        const ticketState = state as MultipleTicketsState;
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

        const repliedIds = new Set(ticketState.repliedIds);
        repliedIds.add(ticket.id);

        const remaining = this.getRemainingReplyTickets({
          ...ticketState,
          repliedIds,
        });
        const msgs: BotMessage[] = [
          { role: 'printy', text: `📩 Reply posted to ${ticket.id}.` },
        ];

        if (remaining.length > 1) {
          return {
            nextNodeId: 'choose_reply_target',
            stateUpdates: { repliedIds, currentTargetId: null },
            messages: [
              ...msgs,
              { role: 'printy', text: 'Pick another ticket to reply to.' },
            ],
          };
        }

        if (remaining.length === 1) {
          return {
            nextNodeId: 'reply',
            stateUpdates: { repliedIds, currentTargetId: remaining[0].id },
            messages: msgs,
          };
        }

        return {
          nextNodeId: 'done',
          stateUpdates: { repliedIds, currentTargetId: null },
          messages: msgs,
        };
      },
    };
  }

  private createDoneNode(): NodeHandler {
    return {
      messages: () => [
        {
          role: 'printy',
          text: 'All selected tickets have been updated. Anything else?',
        },
      ],
      quickReplies: () => ['Change Status', 'Reply to Ticket', 'End Chat'],
    };
  }

  private getSelectedTickets(state: MultipleTicketsState): any[] {
    return state.selectedIds
      .map(id => this.findTicket(id, state))
      .filter(Boolean);
  }

  private getRemainingTickets(state: MultipleTicketsState): any[] {
    return state.selectedIds
      .filter(id => !state.changedIds.has(id))
      .map(id => this.findTicket(id, state))
      .filter(Boolean);
  }

  private getRemainingReplyTickets(state: MultipleTicketsState): any[] {
    return state.selectedIds
      .filter(id => !state.repliedIds.has(id))
      .map(id => this.findTicket(id, state))
      .filter(Boolean);
  }

  private getCurrentTicket(state: MultipleTicketsState): any {
    if (!state.currentTargetId) return null;
    return this.findTicket(state.currentTargetId, state);
  }

  private findTicket(id: string, state: MultipleTicketsState): any {
    const up = id.toUpperCase();
    return (
      state.ticketsRef.find(t => (t.id || '').toUpperCase() === up) ||
      mockTickets.find(t => (t.id || '').toUpperCase() === up)
    );
  }

  private updateTicket(
    ticketId: string,
    updates: Partial<any>,
    state: MultipleTicketsState
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
    state.ticketsRef = state.ticketsRef.map(t =>
      t.id === ticketId ? { ...t, ...updates } : t
    );

    // Refresh if available
    if (this.context.refreshTickets) {
      this.context.refreshTickets();
    }
  }
}

export const multipleTicketsFlow = new MultipleTicketsFlow();
