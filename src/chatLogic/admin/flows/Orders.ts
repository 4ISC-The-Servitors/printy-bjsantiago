import type { ChatFlow, BotMessage } from '../../../types/chatFlow';
import { mockOrders } from '../../../data/orders';
import { formatPriceInput, isValidPriceInput } from '../../../utils/shared';

type Status =
  | 'Pending'
  | 'Processing'
  | 'Awaiting Payment'
  | 'For Delivery/Pick-up'
  | 'Completed'
  | 'Cancelled';

type NodeId =
  | 'start'
  | 'action'
  | 'details'
  | 'choose_status'
  | 'ask_quote_price'
  | 'done';

const STATUS_QR: Status[] = [
  'Pending', 'Processing', 'Awaiting Payment', 'For Delivery/Pick-up', 'Completed', 'Cancelled',
];

function normalizeStatus(input: string): Status | null {
  const t = (input || '').toLowerCase();
  if (t.startsWith('pend')) return 'Pending';
  if (t.startsWith('proc')) return 'Processing';
  if (t.startsWith('await') || t.startsWith('payment')) return 'Awaiting Payment';
  if (t.startsWith('deliver') || t.startsWith('pick') || t.startsWith('for delivery')) return 'For Delivery/Pick-up';
  if (t.startsWith('comp')) return 'Completed';
  if (t.startsWith('cancel')) return 'Cancelled';
  return null;
}

let currentNodeId: NodeId = 'action';
let currentOrderId: string | null = null;
let currentOrders: any[] = [];
let updateOrderRef: ((orderId: string, updates: Partial<any>) => void) | null = null;
let refreshOrdersRef: (() => void) | null = null;

function findOrder(id: string) {
  const up = (id || '').toUpperCase();
  return currentOrders.find(o => (o.id || '').toUpperCase() === up) || mockOrders.find(o => (o.id || '').toUpperCase() === up);
}

function nodeToMessages(node: NodeId): BotMessage[] {
  const order = currentOrderId ? findOrder(currentOrderId) : null;
  switch (node) {
    case 'start':
    case 'action': {
      if (order) {
        return [{ role: 'printy', text: `Looking at order ${order.id} for ${order.customer}. Current status: ${order.status}. What would you like to do?` }];
      }
      return [{ role: 'printy', text: 'Orders assistant ready. What would you like to do?' }];
    }
    case 'details': {
      if (!order) return [];
      const statusIndicator =
        order.status === 'Pending' ? '⏳ Currently pending approval' :
        order.status === 'Processing' ? '🔄 Currently being processed' :
        order.status === 'Awaiting Payment' ? '💰 Awaiting payment from customer' :
        order.status === 'For Delivery/Pick-up' ? '🚚 Ready for delivery/pickup' :
        order.status === 'Completed' ? '✅ Order completed' :
        order.status === 'Cancelled' ? '❌ Order cancelled' : '⏳ Status unknown';
      const msgs: BotMessage[] = [
        { role: 'printy', text: '📋 Order Details' },
        { role: 'printy', text: `ID: ${order.id}` },
        { role: 'printy', text: `Customer: ${order.customer}` },
        { role: 'printy', text: `Status: ${order.status}` },
      ];
      if (order.priority) msgs.push({ role: 'printy', text: `Priority: ${order.priority}` });
      msgs.push(
        { role: 'printy', text: `Date: ${order.date}` },
        { role: 'printy', text: `Total: ${order.total}` },
        { role: 'printy', text: '🖨️ Service Details' },
        { role: 'printy', text: 'Premium Business Cards' },
        { role: 'printy', text: 'Qty: 500 pieces' },
        { role: 'printy', text: 'Size: 3.5" x 2"' },
        { role: 'printy', text: 'Paper: 16pt Matte' },
        { role: 'printy', text: 'Print: Full Color' },
        { role: 'printy', text: 'Finish: Matte Lamination' },
        { role: 'printy', text: 'Design: Customer Logo' },
        { role: 'printy', text: 'Time: 3-5 days' },
        { role: 'printy', text: '💰 Pricing Breakdown' },
        { role: 'printy', text: 'Base: ₱2,500' },
        { role: 'printy', text: 'Paper: +₱800' },
        { role: 'printy', text: 'Lamination: +₱500' },
        { role: 'printy', text: `Total: ${order.total}` },
        { role: 'printy', text: statusIndicator }
      );
      return msgs;
    }
    case 'choose_status': {
      if (!order) return [];
      return [{ role: 'printy', text: `What status would you like to set for ${order.id}?` }];
    }
    case 'ask_quote_price': {
      if (!order) return [];
      return [
        { role: 'printy', text: `Creating quote for ${order.id} (${order.customer}).` },
        { role: 'printy', text: 'Please enter the quote amount (e.g., 3800, 3,800, or ₱3,800).' },
      ];
    }
    case 'done':
      return [{ role: 'printy', text: 'Done. Anything else?' }];
  }
}

function nodeQuickReplies(node: NodeId): string[] {
  switch (node) {
    case 'start':
    case 'action':
      return currentOrderId ? ['View Details', 'Change Status', 'Create Quote', 'End Chat'] : ['Change Status', 'Create Quote', 'End Chat'];
    case 'details':
      return ['Change Status', 'Create Quote', 'End Chat'];
    case 'choose_status':
      return [...STATUS_QR, 'End Chat'];
    case 'ask_quote_price':
      return ['End Chat'];
    case 'done':
      return ['View Details', 'Change Status', 'Create Quote', 'End Chat'];
  }
}

export const ordersFlow: ChatFlow = {
  id: 'admin-orders',
  title: 'Admin Orders',
  initial: (ctx) => {
    currentOrderId = (ctx?.orderId as string) || null;
    updateOrderRef = (ctx?.updateOrder as any) || null;
    currentOrders = (ctx?.orders as any[]) || mockOrders;
    refreshOrdersRef = (ctx?.refreshOrders as any) || null;
    currentNodeId = 'action';
    return nodeToMessages(currentNodeId);
  },
  quickReplies: () => nodeQuickReplies(currentNodeId),
  respond: async (_ctx, input) => {
    const text = input.trim();
    const lower = text.toLowerCase();

    // End chat
    if (lower === 'end chat' || lower === 'end') {
      return { messages: [{ role: 'printy', text: 'Thanks! Chat ended.' }], quickReplies: ['End Chat'] };
    }

    // Action selection
    if (currentNodeId === 'action' || currentNodeId === 'start' || currentNodeId === 'details') {
      if (lower === 'view details') {
        currentNodeId = 'details';
        return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
      }
      if (lower === 'change status' || lower === 'status') {
        currentNodeId = 'choose_status';
        return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
      }
      if (lower.includes('create quote') || lower === 'create quote' || lower === 'quote') {
        const order = currentOrderId ? findOrder(currentOrderId) : null;
        if (order && (order.status === 'Needs Quote' || (String(order.total || '').toUpperCase() === 'TBD'))) {
          currentNodeId = 'ask_quote_price';
          return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
        }
        // Already has a quote or not eligible yet
        const msg = order ? `${order.id} already has a quote (${order.total}). Status: ${order.status}` : 'Please specify an order first.';
        return { messages: [{ role: 'printy', text: msg }], quickReplies: nodeQuickReplies('action') };
      }
      return { messages: nodeToMessages('action'), quickReplies: nodeQuickReplies('action') };
    }

    // Change status node
    if (currentNodeId === 'choose_status' && currentOrderId) {
      const next = normalizeStatus(lower);
      if (!next) {
        return { messages: nodeToMessages('choose_status'), quickReplies: nodeQuickReplies('choose_status') };
      }
      const order = findOrder(currentOrderId);
      const prev = order?.status;
      if (order) {
        if (updateOrderRef) updateOrderRef(order.id, { status: next });
        const mi = mockOrders.findIndex(o => o.id === order.id);
        if (mi !== -1) mockOrders[mi].status = next;
        if (refreshOrdersRef) {
          refreshOrdersRef();
          currentOrders = currentOrders.map(o => o.id === order.id ? { ...o, status: next } : o);
        }
      }
      currentNodeId = 'action';
      return { messages: [{ role: 'printy', text: `✅ ${currentOrderId}: ${prev} → ${next}` }], quickReplies: nodeQuickReplies(currentNodeId) };
    }

    // Create quote - ask for price
    if (currentNodeId === 'ask_quote_price' && currentOrderId) {
      const order = findOrder(currentOrderId);
      if (!order) return { messages: nodeToMessages('action'), quickReplies: nodeQuickReplies('action') };
      const formatted = formatPriceInput(text);
      const priceValid = isValidPriceInput(text) || /\d/.test(text);
      if (!priceValid) {
        return { messages: [{ role: 'printy', text: 'Please enter a valid price amount (e.g., 3800, 3,800, or ₱3,800).' }], quickReplies: nodeQuickReplies('ask_quote_price') };
      }
      if (updateOrderRef) updateOrderRef(order.id, { status: 'Pending', total: formatted });
      const mi = mockOrders.findIndex(o => o.id === order.id);
      if (mi !== -1) {
        mockOrders[mi].status = 'Pending';
        (mockOrders as any)[mi].total = formatted as any;
      }
      if (refreshOrdersRef) {
        refreshOrdersRef();
        currentOrders = currentOrders.map(o => o.id === order.id ? { ...o, status: 'Pending', total: formatted } : o);
      }
      currentNodeId = 'action';
      return { messages: [{ role: 'printy', text: `📋 Quote created for ${order.id}. Set to Pending with total ${formatted}.` }], quickReplies: nodeQuickReplies(currentNodeId) };
    }

    // Fallback
    return { messages: [{ role: 'printy', text: 'Please use the options below.' }], quickReplies: nodeQuickReplies(currentNodeId) };
  },
};

 
