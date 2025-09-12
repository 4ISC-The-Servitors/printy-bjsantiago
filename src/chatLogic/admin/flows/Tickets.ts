import type { ChatFlow, BotMessage } from '../../../types/chatFlow';
import { mockTickets } from '../../../data/tickets';

type TicketStatus = 'Open' | 'Pending' | 'Closed';

type NodeId =
  | 'start'              // greet and prompt to choose a ticket
  | 'action'             // quick replies: Choose Ticket, End Chat
  | 'choose_ticket'      // list or accept TCK id
  | 'ticket_overview'    // show details + ask action
  | 'choose_status'      // status selection
  | 'reply'              // capture reply text
  | 'done';

const STATUS_QR: TicketStatus[] = ['Open', 'Pending', 'Closed'];

function normalizeTicketStatus(input: string): TicketStatus | null {
  const t = (input || '').toLowerCase();
  if (t.startsWith('open')) return 'Open';
  if (t.startsWith('pend')) return 'Pending';
  if (t.startsWith('clos')) return 'Closed';
  return null;
}

let currentNodeId: NodeId = 'start';
let ticketsRef: any[] = [];
let updateTicketRef: ((ticketId: string, updates: Partial<any>) => void) | null = null;
let refreshTicketsRef: (() => void) | null = null;
let currentTicketId: string | null = null;
let awaitingReply: boolean = false;

function findTicket(id: string) {
  const up = id.toUpperCase();
  return ticketsRef.find(t => (t.id || '').toUpperCase() === up) || mockTickets.find(t => (t.id || '').toUpperCase() === up);
}

function extractTicketIds(text: string): string[] {
  const out: string[] = [];
  const re = /\bTCK-\d+\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[0].toUpperCase());
  return out;
}

function nodeToMessages(node: NodeId): BotMessage[] {
  const t = currentTicketId ? findTicket(currentTicketId) : null;
  switch (node) {
    case 'start':
    case 'action':
      return [{ role: 'printy', text: 'Tickets assistant ready. Choose a ticket to manage.' }];
    case 'choose_ticket': {
      const msgs: BotMessage[] = [{ role: 'printy', text: 'Please select a ticket to view.' }];
      ticketsRef.slice(0, 5).forEach(ticket => {
        msgs.push({ role: 'printy', text: `${ticket.id} • ${ticket.subject} • ${ticket.status}` });
      });
      return msgs;
    }
    case 'ticket_overview': {
      if (!t) return [];
      return [
        { role: 'printy', text: `Viewing ${t.id}` },
        { role: 'printy', text: `Subject: ${t.subject}` },
        ...(t.description ? [{ role: 'printy', text: `Description: ${t.description}` }] as BotMessage[] : []),
        { role: 'printy', text: `From: ${t.requester || 'Customer'}` },
        { role: 'printy', text: `Status: ${t.status}` },
        { role: 'printy', text: `Last message: ${t.lastMessage || t.description || '—'}` },
        { role: 'printy', text: 'What would you like to do?' },
      ];
    }
    case 'choose_status':
      return [{ role: 'printy', text: 'Choose a new status for this ticket.' }];
    case 'reply':
      return [{ role: 'printy', text: 'Type your reply message to send to the user.' }];
    case 'done':
      return [{ role: 'printy', text: 'Ticket updated. Anything else?' }];
  }
}

function nodeQuickReplies(node: NodeId): string[] {
  switch (node) {
    case 'start':
    case 'action':
      return ['End Chat'];
    case 'choose_ticket': {
      const firstFive = ticketsRef.slice(0, 5).map(t => t.id);
      return [...firstFive, 'End Chat'];
    }
    case 'ticket_overview':
      return ['Reply', 'Change Status', 'End Chat'];
    case 'choose_status':
      return [...STATUS_QR, 'End Chat'];
    case 'reply':
      return ['End Chat'];
    case 'done':
      return ['Reply', 'Change Status', 'End Chat'];
  }
}

export const ticketsFlow: ChatFlow = {
  id: 'admin-tickets',
  title: 'Admin Tickets',
  initial: (ctx) => {
    // Accept both ticket-specific and generic order-named fields for compatibility with handleChatOpenWithTopic
    ticketsRef = (ctx?.tickets as any[]) || (ctx?.orders as any[]) || mockTickets;
    updateTicketRef = (ctx?.updateTicket as any) || (ctx?.updateOrder as any) || null;
    refreshTicketsRef = (ctx?.refreshTickets as any) || (ctx?.refreshOrders as any) || null;
    currentTicketId = (ctx?.ticketId as string) || (ctx?.orderId as string) || null;
    awaitingReply = false;
    currentNodeId = currentTicketId ? 'ticket_overview' : 'action';
    return nodeToMessages(currentNodeId);
  },
  quickReplies: () => nodeQuickReplies(currentNodeId),
  respond: async (_ctx, input) => {
    const text = input.trim();
    const lower = text.toLowerCase();

    // End chat
    if (lower === 'end chat' || lower === 'end') {
      awaitingReply = false;
      return { messages: [{ role: 'printy', text: 'Thanks! Chat ended.' }] as BotMessage[], quickReplies: ['End Chat'] };
    }

    // Choose ticket path
    if (currentNodeId === 'action' || currentNodeId === 'start' || lower === 'choose ticket') {
      currentNodeId = 'choose_ticket';
      return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
    }

    if (currentNodeId === 'choose_ticket') {
      const ids = extractTicketIds(text);
      const pick = ids[0] || ticketsRef.map(t => t.id.toLowerCase()).find(id => id === lower) || null;
      const chosen = pick ? findTicket(pick) : null;
      if (!chosen) {
        return { messages: [{ role: 'printy', text: 'Please choose a ticket from the list or type its ID (e.g., TCK-2981).' }] as BotMessage[], quickReplies: nodeQuickReplies('choose_ticket') };
      }
      currentTicketId = chosen.id;
      currentNodeId = 'ticket_overview';
      return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
    }

    // Ticket overview actions
    if (currentNodeId === 'ticket_overview') {
      if (lower === 'reply') {
        currentNodeId = 'reply';
        return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
      }
      if (lower === 'change status') {
        currentNodeId = 'choose_status';
        return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
      }
      if (lower === 'choose ticket') {
        currentNodeId = 'choose_ticket';
        return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
      }
      return { messages: [{ role: 'printy', text: 'Use the options below.' }] as BotMessage[], quickReplies: nodeQuickReplies(currentNodeId) };
    }

    // Reply capture
    if (currentNodeId === 'reply' && currentTicketId) {
      const body = text;
      if (!body) {
        return { messages: [{ role: 'printy', text: 'Please type a reply message.' }] as BotMessage[], quickReplies: nodeQuickReplies('reply') };
      }
      const t = findTicket(currentTicketId);
      if (t) {
        // Persist reply: store as lastMessage and keep description for context
        if (updateTicketRef) updateTicketRef(t.id, { lastMessage: body });
        const mi = mockTickets.findIndex(m => m.id === t.id);
        if (mi !== -1) (mockTickets as any)[mi].lastMessage = body;
        if (refreshTicketsRef) {
          refreshTicketsRef();
          ticketsRef = ticketsRef.map(x => x.id === t.id ? { ...x, lastMessage: body } : x);
        }
      }
      currentNodeId = 'ticket_overview';
      return { messages: ([{ role: 'printy', text: `📩 Reply posted to ${currentTicketId}.` }] as BotMessage[]).concat(nodeToMessages(currentNodeId)), quickReplies: nodeQuickReplies(currentNodeId) };
    }

    // Change status
    if (currentNodeId === 'choose_status' && currentTicketId) {
      const next = normalizeTicketStatus(lower);
      if (!next) {
        return { messages: [{ role: 'printy', text: 'Valid statuses: Open, Pending, Closed.' }] as BotMessage[], quickReplies: nodeQuickReplies('choose_status') };
      }
      const t = findTicket(currentTicketId);
      const prev = t?.status;
      if (t) {
        if (updateTicketRef) updateTicketRef(t.id, { status: next });
        const mi = mockTickets.findIndex(m => m.id === t.id);
        if (mi !== -1) (mockTickets as any)[mi].status = next;
        if (refreshTicketsRef) {
          refreshTicketsRef();
          ticketsRef = ticketsRef.map(x => x.id === t.id ? { ...x, status: next } : x);
        }
      }
      currentNodeId = 'ticket_overview';
      return { messages: ([{ role: 'printy', text: `✅ ${currentTicketId}: ${prev} → ${next}` }] as BotMessage[]).concat(nodeToMessages(currentNodeId)), quickReplies: nodeQuickReplies(currentNodeId) };
    }

    // Fallback
    return { messages: [{ role: 'printy', text: 'Please use the options below.' }] as BotMessage[], quickReplies: nodeQuickReplies(currentNodeId) };
  },
};
