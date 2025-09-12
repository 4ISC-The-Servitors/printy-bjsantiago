import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { formatPriceInput, isValidPriceInput } from '../../../utils/shared';
import { mockOrders } from '../../../data/orders';

type Status =
  | 'Pending'
  | 'Processing'
  | 'Awaiting Payment'
  | 'For Delivery/Pick-up'
  | 'Completed'
  | 'Cancelled';

type NodeId =
  | 'multi_start'          // show selected + ask action
  | 'action'               // quick replies: Change Status, End Chat
  | 'choose_id'            // quick replies: [IDs..., Change to All in One instead, End Chat]
  | 'choose_status'        // quick replies: status list
  | 'choose_bulk_status'   // quick replies: status list
  | 'choose_quote_target'  // quick replies: [IDs..., End Chat]
  | 'ask_quote_price'      // expects price input
  | 'done';                // quick replies: Change Status, End Chat

const STATUS_QR: Status[] = [
  'Pending',
  'Processing',
  'Awaiting Payment',
  'For Delivery/Pick-up',
  'Completed',
  'Cancelled',
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

// Session-scoped context (patterned after AboutUs flow style)
let currentNodeId: NodeId = 'multi_start';
let selectedIds: string[] = [];
let ordersRef: any[] = [];
let updateOrderRef: ((orderId: string, updates: Partial<any>) => void) | null = null;
let refreshOrdersRef: (() => void) | null = null;
let currentTargetId: string | null = null;
let changedIds = new Set<string>();
let quotedIds = new Set<string>();

function findOrder(id: string) {
  const up = id.toUpperCase();
  return ordersRef.find(o => (o.id || '').toUpperCase() === up);
}

function extractIds(text: string): string[] {
  const out: string[] = [];
  const re = /\bORD-\d+\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[0].toUpperCase());
  return out;
}

function nodeToMessages(node: NodeId): BotMessage[] {
  switch (node) {
    case 'multi_start': {
      const msgs: BotMessage[] = [
        { role: 'printy', text: `Multiple orders assistant ready (${selectedIds.length} selected).` },
        { role: 'printy', text: 'You selected:' },
      ];
      selectedIds
        .map(id => findOrder(id))
        .filter(Boolean)
        .forEach((o: any) => msgs.push({ role: 'printy', text: `${o.id} • ${o.customer} • ${o.status}` }));
      msgs.push({ role: 'printy', text: 'What do you want to do with these orders?' });
      return msgs;
    }
    case 'action':
      return []; // no extra text; quick replies guide
    case 'choose_id':
      return [{ role: 'printy', text: 'Which order ID would you like to change?' }];
    case 'choose_status': {
      const o = currentTargetId ? findOrder(currentTargetId) : null;
      return o ? [{ role: 'printy', text: `Current status of ${o.id} is ${o.status}. Choose new status.` }] : [];
    }
    case 'choose_bulk_status':
      return [{ role: 'printy', text: 'Okay, apply one status to all selected. What status?' }];
    case 'choose_quote_target':
      return [{ role: 'printy', text: 'Which order ID would you like to create a quote for?' }];
    case 'ask_quote_price': {
      const o = currentTargetId ? findOrder(currentTargetId) : null;
      if (!o) return [];
      return [
        { role: 'printy', text: `Creating quote for ${o.id} (${o.customer}).` },
        { role: 'printy', text: 'Please enter the quote amount (e.g., 3800, 3,800, or ₱3,800).' },
      ];
    }
    case 'done':
      return [{ role: 'printy', text: 'All selected orders have been updated. Anything else?' }];
  }
}

function nodeQuickReplies(node: NodeId): string[] {
  switch (node) {
    case 'multi_start':
    case 'action':
      return ['Change Status', 'Create Quote', 'End Chat'];
    case 'choose_id': {
      const remaining = selectedIds.filter(id => !changedIds.has(id));
      return [...remaining, 'Change to All in One instead', 'End Chat'];
    }
    case 'choose_quote_target': {
      const remaining = selectedIds.filter(id => !quotedIds.has(id));
      return [...remaining, 'End Chat'];
    }
    case 'choose_status':
    case 'choose_bulk_status':
      return [...STATUS_QR, 'End Chat'];
    case 'ask_quote_price':
      return ['End Chat'];
    case 'done':
      return ['Change Status', 'End Chat'];
  }
}

export const multipleOrdersFlow: ChatFlow = {
  id: 'admin-multiple-orders',
  title: 'Admin Multiple Orders',
  initial: (ctx) => {
    selectedIds = Array.isArray(ctx?.orderIds) ? (ctx?.orderIds as string[]).map(x => x.toUpperCase()) : [];
    ordersRef = (ctx?.orders as any[]) || mockOrders;
    updateOrderRef = (ctx?.updateOrder as any) || null;
    refreshOrdersRef = (ctx?.refreshOrders as any) || null;
    changedIds = new Set<string>();
    quotedIds = new Set<string>();
    currentTargetId = null;

    currentNodeId = selectedIds.length > 1 ? 'multi_start' : 'action';
    return nodeToMessages(currentNodeId);
  },
  quickReplies: () => nodeQuickReplies(currentNodeId),
  respond: async (_ctx, input) => {
    const text = input.trim();
    const lower = text.toLowerCase();

    // End chat at any time
    if (lower === 'end chat' || lower === 'end') {
      return { messages: [{ role: 'printy', text: 'Thanks! Chat ended.' }], quickReplies: ['End Chat'] };
    }

    // Flow transitions
    if (currentNodeId === 'multi_start' || currentNodeId === 'action') {
      if (lower === 'change status') {
        currentNodeId = 'choose_id';
        return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
      }
      if (lower === 'create quote' || lower === 'quote' || lower === 'make quote') {
        currentNodeId = 'choose_quote_target';
        return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
      }
      return { messages: [{ role: 'printy', text: `You selected ${selectedIds.length} orders. What do you want to do with these orders?` }], quickReplies: nodeQuickReplies('action') };
    }

    if (currentNodeId === 'choose_id') {
      if (lower === 'change to all in one instead') {
        currentNodeId = 'choose_bulk_status';
        return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
      }
      const remaining = selectedIds.filter(id => !changedIds.has(id));
      const ids = extractIds(text);
      const pick = ids[0] || remaining.find(id => id.toLowerCase() === lower);
      if (!pick || !remaining.includes(pick)) {
        return { messages: [{ role: 'printy', text: 'Please pick one of the selected order IDs.' }], quickReplies: nodeQuickReplies('choose_id') };
      }
      currentTargetId = pick;
      currentNodeId = 'choose_status';
      return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
    }

    if (currentNodeId === 'choose_status' && currentTargetId) {
      const next = normalizeStatus(lower);
      if (!next) {
        return { messages: [{ role: 'printy', text: `What status should I set for ${currentTargetId}?` }], quickReplies: nodeQuickReplies('choose_status') };
      }
      const order = findOrder(currentTargetId);
      const prev = order?.status;
      if (order) {
        if (updateOrderRef) updateOrderRef(order.id, { status: next });
        const mi = mockOrders.findIndex(o => o.id === order.id);
        if (mi !== -1) mockOrders[mi].status = next;
        if (refreshOrdersRef) {
          refreshOrdersRef();
          // Update ordersRef to reflect the changes
          ordersRef = ordersRef.map(o => o.id === order.id ? { ...o, status: next } : o);
        }
      }

      changedIds.add(currentTargetId);
      const remaining = selectedIds.filter(id => !changedIds.has(id));
      const msgs: BotMessage[] = [{ role: 'printy', text: `✅ ${currentTargetId}: ${prev} → ${next}` }];

      if (remaining.length > 1) {
        currentTargetId = null;
        currentNodeId = 'choose_id';
        msgs.push({ role: 'printy', text: 'Pick another order to update.' });
        return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
      }
      if (remaining.length === 1) {
        currentTargetId = remaining[0];
        currentNodeId = 'choose_status';
        msgs.push(...nodeToMessages(currentNodeId));
        return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
      }
      currentTargetId = null;
      currentNodeId = 'done';
      msgs.push(...nodeToMessages(currentNodeId));
      return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
    }

    if (currentNodeId === 'choose_bulk_status') {
      const next = normalizeStatus(lower);
      if (!next) {
        return { messages: nodeToMessages('choose_bulk_status'), quickReplies: nodeQuickReplies('choose_bulk_status') };
      }
      const msgs: BotMessage[] = [{ role: 'printy', text: `✅ Applying ${next} to ${selectedIds.length} order(s):` }];
      selectedIds.forEach(id => {
        const o = findOrder(id);
        const prev = o?.status;
        if (o) {
          if (updateOrderRef) updateOrderRef(o.id, { status: next });
          const mi = mockOrders.findIndex(m => m.id === o.id);
          if (mi !== -1) mockOrders[mi].status = next;
        }
        msgs.push({ role: 'printy', text: `${id}: ${prev} → ${next}` });
      });
      if (refreshOrdersRef) {
        refreshOrdersRef();
        // Update ordersRef to reflect all changes
        ordersRef = ordersRef.map(o => 
          selectedIds.includes(o.id) ? { ...o, status: next } : o
        );
      }
      changedIds = new Set(selectedIds);
      currentNodeId = 'done';
      msgs.push(...nodeToMessages(currentNodeId));
      return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
    }

    // Quote creation flow (individual per ID)
    if (currentNodeId === 'choose_quote_target') {
      const remaining = selectedIds.filter(id => !quotedIds.has(id));
      const ids = extractIds(text);
      const pick = ids[0] || remaining.find(id => id.toLowerCase() === lower);
      if (!pick || !remaining.includes(pick)) {
        return { messages: [{ role: 'printy', text: 'Please pick one of the selected order IDs.' }], quickReplies: nodeQuickReplies('choose_quote_target') };
      }
      currentTargetId = pick;
      currentNodeId = 'ask_quote_price';
      return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
    }

    if (currentNodeId === 'ask_quote_price' && currentTargetId) {
      // Validate price
      const formatted = formatPriceInput(text);
      const priceValid = isValidPriceInput(text) || /\d/.test(text);
      if (!priceValid) {
        return { messages: [{ role: 'printy', text: 'Please enter a valid price amount (e.g., 3800, 3,800, or ₱3,800).' }], quickReplies: nodeQuickReplies('ask_quote_price') };
      }

      const o = findOrder(currentTargetId);
      if (o) {
        if (updateOrderRef) updateOrderRef(o.id, { status: 'Pending', total: formatted });
        const mi = mockOrders.findIndex(m => m.id === o.id);
        if (mi !== -1) {
          mockOrders[mi].status = 'Pending';
          (mockOrders as any)[mi].total = formatted as any;
        }
        if (refreshOrdersRef) {
          refreshOrdersRef();
          ordersRef = ordersRef.map(ord => ord.id === o.id ? { ...ord, status: 'Pending', total: formatted } : ord);
        }
      }

      quotedIds.add(currentTargetId);
      const remaining = selectedIds.filter(id => !quotedIds.has(id));
      const msgs: BotMessage[] = [
        { role: 'printy', text: `📋 Quote created for ${currentTargetId}. Set to Pending with total ${formatted}.` },
      ];

      if (remaining.length > 1) {
        currentTargetId = null;
        currentNodeId = 'choose_quote_target';
        msgs.push({ role: 'printy', text: 'Pick another order to create a quote for.' });
        return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
      }
      if (remaining.length === 1) {
        currentTargetId = remaining[0];
        currentNodeId = 'ask_quote_price';
        msgs.push(...nodeToMessages(currentNodeId));
        return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
      }
      currentTargetId = null;
      currentNodeId = 'done';
      msgs.push(...nodeToMessages(currentNodeId));
      return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
    }

    // Fallback to guidance for any unexpected input
    return { messages: [{ role: 'printy', text: 'Please use the options below.' }], quickReplies: nodeQuickReplies(currentNodeId) };
  },
};
