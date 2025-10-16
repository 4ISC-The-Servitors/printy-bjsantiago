import type { ChatFlow } from '../../types/chatFlow';
import { ordersFlow } from './flows/Orders';
import { multipleOrdersFlow } from './flows/MultipleOrders';
import { ticketsFlow } from './flows/Tickets';
import { multipleTicketsFlow } from './flows/MultipleTickets';
import { portfolioFlow } from './flows/Portfolio';
import { multiplePortfolioFlow } from './flows/MultiplePortfolio';
import { addServiceFlow } from './flows/AddService';
import { JsonbFlowProcessor } from '../../features/chat/core/services/JsonbFlowProcessor';
import { getFlowDefinition } from '../../features/api/jsonbChatFlowApi';
import { supabase } from '../../lib/supabase';

const introFlow: ChatFlow = {
  id: 'admin-intro',
  title: 'Admin Intro',
  initial: () => [
    {
      role: 'printy',
      text: "Hello! I'm Printy, your admin assistant. What would you like to do today?",
    },
  ],
  quickReplies: () => ['Orders', 'Tickets', 'Portfolio', 'End Chat'],
  respond: async (_ctx, input) => {
    const t = input.toLowerCase();
    if (t.includes('order')) {
      return {
        messages: [
          {
            role: 'printy',
            text: 'Opening Orders… You can change status or create quotes.',
          },
        ],
        quickReplies: ['Change Status', 'Create Quote', 'End Chat'],
      };
    }
    if (t.includes('ticket')) {
      return {
        messages: [
          {
            role: 'printy',
            text: 'Opening Tickets… Change status or reply to tickets.',
          },
        ],
        quickReplies: ['Change Ticket Status', 'Reply to Ticket', 'End Chat'],
      };
    }
    if (t.includes('portfolio')) {
      return {
        messages: [
          {
            role: 'printy',
            text: 'Opening Portfolio… Change service status or add services.',
          },
        ],
        quickReplies: ['Change Service Status', 'Add Service', 'End Chat'],
      };
    }
    if (t.includes('service')) {
      return {
        messages: [
          { role: 'printy', text: 'Opening Portfolio… Choose an action.' },
        ],
        quickReplies: ['Change Service Status', 'Add Service', 'End Chat'],
      };
    }
    if (t.includes('end')) {
      return {
        messages: [{ role: 'printy', text: 'Thanks! Chat ended.' }],
        quickReplies: ['End Chat'],
      };
    }
    return {
      messages: [{ role: 'printy', text: 'Please choose an option.' }],
      quickReplies: ['Orders', 'Tickets', 'Portfolio', 'End Chat'],
    };
  },
};

export const adminFlows: Record<string, ChatFlow> = {
  intro: introFlow,
  orders: ordersFlow,
  multipleOrders: multipleOrdersFlow,
  tickets: ticketsFlow,
  multipleTickets: multipleTicketsFlow,
  portfolio: portfolioFlow,
  multiplePortfolio: multiplePortfolioFlow,
  addService: addServiceFlow,
};

export function resolveAdminFlow(topic?: string | null): ChatFlow | null {
  const t = (topic || 'intro').toLowerCase();
  // Route admin quote session to the JSONB flow when a conversation is being handled
  if (t.includes('quotes') || t.includes('quote')) {
    // Adapter ChatFlow that proxies to JSONB processor using admin-quote-propose
    const jsonbAdapter: ChatFlow = {
      id: 'admin-quote-propose-adapter',
      title: 'Admin Quote Propose',
      initial: async (ctx: any) => {
        const sessionRef = ctx?.session_id || ctx?.conversationId;
        // Use the current authenticated user as the session owner to satisfy RLS
        const { data: userData } = await supabase.auth.getUser();
        const customerId = userData?.user?.id || ctx?.customerId || ctx?.quotes?.[0]?.customer_id;
        const flowDef = await getFlowDefinition('admin-quote-propose');
        if (!flowDef) return [{ role: 'printy', text: 'Flow not available.' }];
        const start = await JsonbFlowProcessor.startFlow({
          flowId: 'admin-quote-propose',
          customerId,
          flowDefinition: flowDef,
          initialContext: { session_id: sessionRef },
        });
        // Stash sessionId if needed by outer orchestrator – ignored here
        return start.messages;
      },
      quickReplies: async (_ctx: any) => ['Summarize Order Specs', 'Manual Order Specs', 'Send Specs to Customer', 'End Chat'],
      respond: async (_ctx: any, _input: string) => {
        const flowDef = await getFlowDefinition('admin-quote-propose');
        if (!flowDef) return { messages: [{ role: 'printy', text: 'Flow not available.' }] } as any;
        // We need the last created session for this adapter; in this simplified adapter,
        // rely on JsonbFlowProcessor to track current node via session metadata and let UI pass sessionId if needed.
        // For now, just echo a guidance message since legacy admin panel doesn’t pass sessionId through.
        return {
          messages: [{ role: 'printy', text: 'Please use the options above in the panel to proceed.' }],
          quickReplies: ['Summarize Order Specs', 'Manual Order Specs', 'Send Specs to Customer', 'End Chat'],
        } as any;
      },
    };
    return jsonbAdapter;
  }
  if (t.includes('add-service') || t.includes('add service'))
    return addServiceFlow;
  if (t.includes('multiple-portfolio') || t.includes('multi-portfolio'))
    return multiplePortfolioFlow;
  if (t.includes('multiple-tickets') || t.includes('multi-tickets'))
    return multipleTicketsFlow;
  if (
    t.includes('multiple-orders') ||
    t.includes('multi') ||
    t.includes('bulk')
  )
    return multipleOrdersFlow;
  // Fallbacks
  if (t.includes('order')) return ordersFlow;
  if (t.includes('ticket')) return ticketsFlow;
  if (t.includes('portfolio') || t.includes('service')) return portfolioFlow;
  return introFlow;
}

export function dispatchAdminCommand(input: string) {
  // Naive route: check keywords to pick a flow; default intro
  const text = (input || '').toLowerCase();
  let flow = introFlow;
  if (
    text.includes('ord-') ||
    text.includes('order') ||
    text.includes('status') ||
    text.includes('quote')
  ) {
    // If there are 2+ order ids in the message, use multipleOrders flow
    const idMatches = (text.match(/\bord-\d+\b/g) || []).length;
    flow = idMatches >= 2 ? multipleOrdersFlow : ordersFlow;
  } else if (
    text.includes('tck-') ||
    text.includes('ticket') ||
    text.includes('reply')
  ) {
    // If there are 2+ ticket ids in the message, use multipleTickets flow
    const ticketMatches = (text.match(/\btck-\d+\b/g) || []).length;
    flow = ticketMatches >= 2 ? multipleTicketsFlow : ticketsFlow;
  } else if (
    text.includes('add service') ||
    text.includes('add-service') ||
    text.includes('create service') ||
    text.includes('new service')
  ) {
    flow = addServiceFlow;
  } else if (
    text.includes('srv-') ||
    text.includes('service') ||
    text.includes('portfolio')
  ) {
    // If there are 2+ service codes in the message, use multiplePortfolio flow
    const serviceMatches = (text.match(/\bsrv-[a-z0-9]+\b/g) || []).length;
    flow = serviceMatches >= 2 ? multiplePortfolioFlow : portfolioFlow;
  }
  if (!flow) return null;

  return flow.respond({}, input);
}
