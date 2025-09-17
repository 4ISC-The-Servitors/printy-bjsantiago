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
    const { data, error } = await supabase
      .from('printing_services')
      .select('*')
      .is('parent_service_id', null)
      .eq('active_status', 'active')
      .order('service_name', { ascending: true });
    if (error) {
      console.error('Error fetching services:', error);
      return { service: null, children: [] };
    }
    return { service: null, children: data || [] };
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

  const { data: childrenData, error: childrenError } = await supabase
    .from('printing_services')
    .select('*')
    .eq('parent_service_id', serviceId)
    .eq('active_status', 'active')
    .order('service_name', { ascending: true });
  if (childrenError) {
    console.error('Error fetching child services:', childrenError);
    return { service: serviceData, children: [] };
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
      const selectedChild = children.find(
        c => c.service_name?.toLowerCase() === normalized
      );
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
      cachedQuickReplies = nextChildren.map(c => c.service_name as string);
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
      cachedQuickReplies = children.map(c => c.service_name as string);
      const messages: BotMessage[] = [
        {
          role: 'printy',
          text:
            'We offer a variety of printing Services. What type are you interested in?',
        },
      ];
      return { messages, quickReplies: cachedQuickReplies };
    }

    // If user chose End Chat option in static menu
    if (currentNodeId === 'end') {
      return { messages: nodeToMessages(NODES[currentNodeId]), quickReplies: ['End Chat'] };
    }

    // Any other static nodes are no-ops in this dynamic setup
    const node = NODES[currentNodeId];
    const messages = nodeToMessages(node);
    const quickReplies = nodeQuickReplies(node);

    // Store user selections in orderRecord at key steps
    // Example: page size and quantity nodes
    if (
      [
        'standard_paperback',
        'common_book_size',
        'standard_letter',
        'small_banner',
        'standard_size',
        'large_banner',
      ].includes(currentNodeId)
    ) {
      orderRecord.page_size = Number(
        currentNodeId === 'standard_paperback'
          ? 1
          : currentNodeId === 'common_book_size'
          ? 2
          : currentNodeId === 'standard_letter'
          ? 3
          : currentNodeId === 'small_banner'
          ? 4
          : currentNodeId === 'standard_size'
          ? 5
          : currentNodeId === 'large_banner'
          ? 6
          : 1
      );
    }
    if (
      [
        'one_thousand_pages',
        'five_hundred_pages',
        'two_hundred_fifty_pages',
        'one_hundred_pages',
        'fifty_pages',
        'twenty_pages',
        'ten_pages',
      ].includes(currentNodeId)
    ) {
      orderRecord.quantity = Number(
        currentNodeId === 'one_thousand_pages'
          ? 1000
          : currentNodeId === 'five_hundred_pages'
          ? 500
          : currentNodeId === 'two_hundred_fifty_pages'
          ? 250
          : currentNodeId === 'one_hundred_pages'
          ? 100
          : currentNodeId === 'fifty_pages'
          ? 50
          : currentNodeId === 'twenty_pages'
          ? 20
          : currentNodeId === 'ten_pages'
          ? 10
          : 1
      );
    }

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
