import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { createOrder } from '../../../api/orderApi';
import type { OrderData } from '../../../api/orderApi';
import { getCurrentCustomerId } from '../../../lib/utils';
import { supabase } from '../../../lib/supabase';

type Option = { label: string; next: string };
type Node = {
  id: string;
  message?: string;
  question?: string;
  answer?: string;
  options: Option[];
};

const NODES: Record<string, Node> = {
  place_order_start: {
    id: 'place_order_start',
    message:
      "Hi! I'm Printy. I can help you with your printing needs. You can either place an order or track an existing one.",
    options: [
      { label: 'Place Order', next: 'place_order' },
      { label: 'Track Order', next: 'track_order' },
      { label: 'End Chat', next: 'end' },
    ],
  },
  place_order: {
    id: 'place_order',
    question: 'Place Order',
    answer:
      'We offer a variety of printing Services. What type are you interested in?',
    options: [
      // Options will be populated dynamically; static list removed
      { label: 'End Chat', next: 'end' },
    ],
  },
  track_order: {
    id: 'track_order',
    answer: 'Order tracking is not yet available here. Please use the Track Order page.',
    options: [{ label: 'End Chat', next: 'end' }],
  },
  end: {
    id: 'end',
    answer: 'Thank you for chatting with Printy! Have a great day. 👋',
    options: [],
  },
};

let currentNodeId: keyof typeof NODES = 'place_order_start';

// Dynamic services navigation state
let currentServiceId: string | null = null;
let serviceStack: string[] = [];
let dynamicMode = false;

// Cache for synchronous quickReplies API
let cachedQuickReplies: string[] = [];

// Store order details progressively, include selected service path
let orderRecord: Partial<OrderData & { service_choices?: string[] }> = {
  service_choices: [],
};

// --- Dynamic helpers ---
async function getServiceDetails(serviceId: string | null): Promise<{
  service: any | null;
  children: any[];
}> {
  if (!serviceId) {
    // First: strictly NULL parents (no active_status filter to avoid mismatches)
    const nullParents = await supabase
      .from('printing_services')
      .select('*')
      .is('parent_service_id', null)
      .order('service_name', { ascending: true });
    if (nullParents.error) {
      console.error('Error fetching services (null parent):', nullParents.error);
      return { service: null, children: [] };
    }
    let rows = nullParents.data || [];
    // If none, try empty-string parents
    if (!rows.length) {
      const emptyParents = await supabase
        .from('printing_services')
        .select('*')
        .eq('parent_service_id', '')
        .order('service_name', { ascending: true });
      if (!emptyParents.error && emptyParents.data) rows = emptyParents.data;
    }
    // If still none, retry both with both null and empty (already without status)
    if (!rows.length) {
      const nullNoStatus = await supabase
        .from('printing_services')
        .select('*')
        .is('parent_service_id', null)
        .order('service_name', { ascending: true });
      rows = nullNoStatus.data || [];
      if (!rows.length) {
        const emptyNoStatus = await supabase
          .from('printing_services')
          .select('*')
          .eq('parent_service_id', '')
          .order('service_name', { ascending: true });
        rows = emptyNoStatus.data || [];
      }
    }
    return { service: null, children: rows };
  }

  const { data: serviceData, error: serviceError } = await supabase
    .from('printing_services')
    .select('*')
    .eq('service_id', serviceId)
    .maybeSingle();
  if (serviceError) {
    console.error('Error fetching service:', serviceError);
    return { service: null, children: [] };
  }

  let { data: childrenData, error: childrenError } = await supabase
    .from('printing_services')
    .select('*')
    .eq('parent_service_id', serviceId)
    .order('service_name', { ascending: true });
  if (childrenError) {
    console.error('Error fetching child services:', childrenError);
    return { service: serviceData, children: [] };
  }
  if (!childrenData || childrenData.length === 0) {
    const retry = await supabase
      .from('printing_services')
      .select('*')
      .eq('parent_service_id', serviceId)
      .order('service_name', { ascending: true });
    if (!retry.error && retry.data) childrenData = retry.data;
  }

  return { service: serviceData, children: childrenData || [] };
}

function dbToMessages(service: any, fallback?: string): BotMessage[] {
  if (service?.description) return [{ role: 'printy', text: service.description }];
  if (fallback) return [{ role: 'printy', text: fallback }];
  if (service?.service_name)
    return [{ role: 'printy', text: `You have selected ${service.service_name}.` }];
  return [];
}

function nodeToMessages(node: Node): BotMessage[] {
  if (node.message) return [{ role: 'printy', text: node.message }];
  if (node.answer) return [{ role: 'printy', text: node.answer }];
  return [];
}

function nodeQuickReplies(node: Node): string[] {
  return node.options.map(o => o.label);
}

export const placeOrderFlow: ChatFlow = {
  id: 'place-order',
  title: 'Place an Order',
  initial: () => {
    // reset state
    currentNodeId = 'place_order_start';
    dynamicMode = false;
    currentServiceId = null;
    serviceStack = [];
    cachedQuickReplies = [];
    orderRecord = { service_choices: [] };
    return nodeToMessages(NODES[currentNodeId]);
  },
  quickReplies: () => {
    if (dynamicMode) return cachedQuickReplies;
    return nodeQuickReplies(NODES[currentNodeId]);
  },
  respond: async (ctx, input) => {
    // If in dynamic mode, handle DB-driven navigation
    if (dynamicMode) {
      const normalized = input.trim().toLowerCase();

      // Handle Back navigation
      if (normalized === 'back') {
        // Remove last chosen service from record
        if (Array.isArray(orderRecord.service_choices) && orderRecord.service_choices.length > 0) {
          orderRecord.service_choices.pop();
        }

        // Move up one level
        currentServiceId = serviceStack.length > 0 ? serviceStack.pop() || null : null;

        const { service: parentService, children: parentChildren } = await getServiceDetails(
          currentServiceId
        );
        cachedQuickReplies = parentChildren.map(c => c.service_name as string);
        if (currentServiceId) cachedQuickReplies = [...cachedQuickReplies, 'Back'];

        const messages = dbToMessages(
          parentService,
          currentServiceId
            ? 'Please choose one of the options.'
            : 'We offer a variety of printing Services. What type are you interested in?'
        );
        return { messages, quickReplies: cachedQuickReplies };
      }

      const { children } = await getServiceDetails(currentServiceId);
      const selectedChild = children.find(c => {
        const name = (c.service_name || c.service_id || '').toString().toLowerCase();
        return name === normalized;
      });
      if (!selectedChild) {
        return {
          messages: [{ role: 'printy', text: 'Please choose one of the options.' }],
          quickReplies: cachedQuickReplies,
        };
      }

      if (currentServiceId) serviceStack.push(currentServiceId);
      currentServiceId = selectedChild.service_id as string;
      orderRecord.service_choices?.push(currentServiceId);

      const { service: nextService, children: nextChildren } = await getServiceDetails(
        currentServiceId
      );
      cachedQuickReplies = nextChildren
        .map(c => (c.service_name || c.service_id) as string)
        .filter(Boolean);
      if (currentServiceId) cachedQuickReplies = [...cachedQuickReplies, 'Back'];
      const messages = dbToMessages(
        nextService,
        "Great choice! What would you like to choose next?"
      );

      // Leaf node: no children => create order
      if (nextChildren.length === 0) {
        const sessionCustomerId =
          typeof ctx.customerId === 'string' && ctx.customerId.length === 36
            ? ctx.customerId
            : getCurrentCustomerId();

        const order: OrderData = {
          order_id: crypto.randomUUID(),
          service_id: orderRecord.service_choices?.[0] || '1001',
          customer_id: sessionCustomerId,
          order_status: 'pending',
          delivery_mode:
            typeof ctx.deliveryMode === 'string' ? ctx.deliveryMode : 'pickup',
          order_date_time: new Date().toISOString(),
          completed_date_time: null,
          page_size:
            typeof (orderRecord as Partial<OrderData>).page_size === 'number'
              ? (orderRecord as Partial<OrderData>).page_size as number
              : 1,
          quantity:
            typeof (orderRecord as Partial<OrderData>).quantity === 'number'
              ? (orderRecord as Partial<OrderData>).quantity as number
              : 1,
          priority_level:
            typeof ctx.priorityLevel === 'number' ? ctx.priorityLevel : 1,
        };

        await createOrder(order);

        // Allow user to go back or end after order creation
        // Keep context so they can tweak selection with Back if desired
        cachedQuickReplies = ['Back', 'End Chat'];

        return {
          messages: [
            ...messages,
            {
              role: 'printy',
              text: "Your order has been submitted! We'll be in touch with a quote.",
            },
          ],
          quickReplies: cachedQuickReplies,
        };
      }

      return { messages, quickReplies: cachedQuickReplies };
    }

    // Static mode for initial choice only
    const current = NODES[currentNodeId];
    const selection = current.options.find(
      o => o.label.toLowerCase() === input.trim().toLowerCase()
    );
    if (!selection) {
      return {
        messages: [{ role: 'printy', text: 'Please choose one of the options.' }],
        quickReplies: nodeQuickReplies(current),
      };
    }
    currentNodeId = selection.next as keyof typeof NODES;

    // When user selects Place Order, switch to dynamic services
    if (currentNodeId === 'place_order') {
      dynamicMode = true;
      currentServiceId = null;
      const { children } = await getServiceDetails(null);
      // Debug: log top-level services fetched
      try {
        console.log('[PlaceOrder] Root services fetched:', (children || []).length);
        if (children && children.length) {
          console.log('[PlaceOrder] First root service sample:', {
            service_id: children[0]?.service_id,
            service_name: children[0]?.service_name,
            parent_service_id: children[0]?.parent_service_id,
          });
        }
      } catch {}
      cachedQuickReplies = (children || [])
        .map(c => ((c.service_name || c.service_id || '') as string).trim())
        .filter(name => name.length > 0);
      const messages: BotMessage[] = [
        {
          role: 'printy',
          text:
            'We offer a variety of printing Services. What type are you interested in?',
        },
      ];
      return { messages, quickReplies: cachedQuickReplies.length ? cachedQuickReplies : ['End Chat'] };
    }

    // If user chose End Chat option in static menu
    if (currentNodeId === 'end') {
      return { messages: nodeToMessages(NODES[currentNodeId]), quickReplies: ['End Chat'] };
    }

    // Any other static nodes are no-ops in this dynamic setup
    const node = NODES[currentNodeId];
    const messages = nodeToMessages(node);
    const quickReplies = nodeQuickReplies(node);

    // Legacy static size/quantity nodes removed; specs come from database

    // When ready to create the order
    if (currentNodeId === 'create_quote') {
      // Use customer_id from session/localStorage
      const sessionCustomerId =
        typeof ctx.customerId === 'string' && ctx.customerId.length === 36
          ? ctx.customerId
          : getCurrentCustomerId();

      const order: OrderData = {
        order_id: crypto.randomUUID(),
        service_id: typeof ctx.serviceId === 'string' ? ctx.serviceId : '1001',
        customer_id: sessionCustomerId,
        order_status: 'pending',
        delivery_mode: typeof ctx.deliveryMode === 'string' ? ctx.deliveryMode : 'pickup',
        order_date_time: new Date().toISOString(),
        completed_date_time: null,
        page_size: typeof orderRecord.page_size === 'number' ? orderRecord.page_size : 1,
        quantity: typeof orderRecord.quantity === 'number' ? orderRecord.quantity : 100,
        priority_level: typeof ctx.priorityLevel === 'number' ? ctx.priorityLevel : 1,
      };

      console.log('Using customer_id:', sessionCustomerId); // <-- Add here

      await createOrder(order);
      orderRecord = {};
    }

    // If user chose End Chat option, still provide the closing message and a single End Chat button
    if (currentNodeId === 'end') {
      return { messages, quickReplies: ['End Chat'] };
    }
    return { messages, quickReplies };
  },
};
