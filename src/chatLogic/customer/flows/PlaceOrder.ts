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

// Multi-phase navigation state
type NavigationPhase = 'products' | 'specifications' | 'sizes' | 'quantities' | 'confirmation';

let currentPhase: NavigationPhase = 'products';
let currentServiceId: string | null = null;
let serviceStack: string[] = [];
let dynamicMode = false;

// Cache for synchronous quickReplies API
let cachedQuickReplies: string[] = [];

// Store order details progressively
let orderRecord: Partial<OrderData & { 
  product_service_id?: string;
  product_service_name?: string;
  specification_name?: string;
  size_name?: string;
  quantity_name?: string;
}> = {};

// Helper to extract numeric value from quantity strings like "1000 pages", "250 pages"
function extractQuantityFromString(quantityStr: string): number {
  const match = quantityStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

// --- Dynamic helpers ---
async function getServiceDetails(serviceId: string | null): Promise<{
  service: any | null;
  children: any[];
}> {
  if (!serviceId) {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      console.log('[PlaceOrder] Auth user for root fetch:', authUser?.user?.id || 'none');
    } catch {}
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
    if (!rows.length) {
      console.warn('[PlaceOrder] Root fetch returned 0 rows (NULL parent). Retrying with empty string parent...');
    }
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
      console.warn('[PlaceOrder] Root fetch still 0 rows. Final retry without any parent filter normalization...');
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

// Helper to get top-level services by category
async function getTopLevelServices(category: 'products' | 'specifications' | 'sizes' | 'quantities'): Promise<any[]> {
  const categoryMap = {
    products: ['PRNT', 'DIGI', 'PACK', 'LARG'],
    specifications: ['SPEC'],
    sizes: ['SIZE'],
    quantities: ['QUAN']
  };
  
  const serviceIds = categoryMap[category];
  const { data, error } = await supabase
    .from('printing_services')
    .select('*')
    .in('service_id', serviceIds)
    .is('parent_service_id', null)
    .order('service_name', { ascending: true });
  
  if (error) {
    console.error(`Error fetching ${category} services:`, error);
    return [];
  }
  
  return data || [];
}

// Helper to handle back navigation across phases
async function handleBackNavigation(ctx: any): Promise<any> {
  if (currentPhase === 'products') {
    // Can't go back further in products phase
    return {
      messages: [{ role: 'printy', text: 'Please choose one of the options.' }],
      quickReplies: cachedQuickReplies,
    };
  }
  
  // Move to previous phase
  const phaseOrder: NavigationPhase[] = ['products', 'specifications', 'sizes', 'quantities', 'confirmation'];
  const currentIndex = phaseOrder.indexOf(currentPhase);
  if (currentIndex > 0) {
    currentPhase = phaseOrder[currentIndex - 1];
  }
  
  // Reset current service and stack for the new phase
  currentServiceId = null;
  serviceStack = [];
  
  // Load options for the new phase
  return await loadPhaseOptions(ctx);
}

// Helper to load options for current phase
async function loadPhaseOptions(_ctx: any): Promise<any> {
  if (currentPhase === 'products') {
    const children = await getTopLevelServices('products');
    cachedQuickReplies = children
      .map(c => ((c.service_name || c.service_id || '') as string).trim())
      .filter(name => name.length > 0);
    cachedQuickReplies = [...cachedQuickReplies, 'Back'];
    
    return {
      messages: [{ role: 'printy', text: 'We offer a variety of printing Services. What type are you interested in?' }],
      quickReplies: cachedQuickReplies,
    };
  } else if (currentPhase === 'specifications') {
    const children = await getTopLevelServices('specifications');
    cachedQuickReplies = children
      .map(c => ((c.service_name || c.service_id || '') as string).trim())
      .filter(name => name.length > 0);
    cachedQuickReplies = [...cachedQuickReplies, 'Back'];
    
    return {
      messages: [{ role: 'printy', text: 'Great! Now let\'s choose the specifications. What would you like?' }],
      quickReplies: cachedQuickReplies,
    };
  } else if (currentPhase === 'sizes') {
    const children = await getTopLevelServices('sizes');
    cachedQuickReplies = children
      .map(c => ((c.service_name || c.service_id || '') as string).trim())
      .filter(name => name.length > 0);
    cachedQuickReplies = [...cachedQuickReplies, 'Back'];
    
    return {
      messages: [{ role: 'printy', text: 'Perfect! Now let\'s choose the size. What size do you need?' }],
      quickReplies: cachedQuickReplies,
    };
  } else if (currentPhase === 'quantities') {
    const children = await getTopLevelServices('quantities');
    cachedQuickReplies = children
      .map(c => ((c.service_name || c.service_id || '') as string).trim())
      .filter(name => name.length > 0);
    cachedQuickReplies = [...cachedQuickReplies, 'Back'];
    
    return {
      messages: [{ role: 'printy', text: 'Excellent! Finally, let\'s choose the quantity. How many do you need?' }],
      quickReplies: cachedQuickReplies,
    };
  } else if (currentPhase === 'confirmation') {
    // Show order summary and confirmation with proper formatting using multiple messages
    const messages: BotMessage[] = [
      { role: 'printy', text: '📋 Order Summary' },
      { role: 'printy', text: `🖨️ Product: ${orderRecord.product_service_name || 'N/A'}` },
      { role: 'printy', text: `⚙️ Specification: ${orderRecord.specification_name || 'N/A'}` },
      { role: 'printy', text: `📏 Size: ${orderRecord.size_name || 'N/A'}` },
      { role: 'printy', text: `📦 Quantity: ${orderRecord.quantity_name || 'N/A'}` },
      { role: 'printy', text: 'Please review your order details above. If everything looks correct, click "Confirm Order" to proceed.' }
    ];
    
    cachedQuickReplies = ['Confirm Order', 'Back'];
    
    return {
      messages,
      quickReplies: cachedQuickReplies,
    };
  }
  
  return {
    messages: [{ role: 'printy', text: 'Please choose one of the options.' }],
    quickReplies: ['End Chat'],
  };
}

// Helper to handle phase-specific navigation
async function handlePhaseNavigation(ctx: any, input: string): Promise<any> {
  const normalized = input.trim().toLowerCase();
  
  // Handle confirmation
  if (currentPhase === 'confirmation') {
    if (normalized === 'confirm order') {
      return await createOrderFromCompilation(ctx);
    } else if (normalized === 'back') {
      return await handleBackNavigation(ctx);
    }
  }
  
  // Handle other phases
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
  
  // Update service stack and current service
  if (currentServiceId) serviceStack.push(currentServiceId);
  currentServiceId = selectedChild.service_id as string;
  
  // Get next level options
  const { service: nextService, children: nextChildren } = await getServiceDetails(currentServiceId);
  
  // If no children, this is a leaf node - record and move to next phase
  if (nextChildren.length === 0) {
    return await handleLeafNodeSelection(selectedChild, ctx);
  }
  
  // Update quick replies for current level
  cachedQuickReplies = nextChildren
    .map(c => ((c.service_name || c.service_id || '') as string).trim())
    .filter(name => name.length > 0);
  cachedQuickReplies = [...cachedQuickReplies, 'Back'];
  
  const messages = dbToMessages(
    nextService,
    "Great choice! What would you like to choose next?"
  );
  
  return { messages, quickReplies: cachedQuickReplies };
}

// Helper to handle leaf node selection and phase transition
async function handleLeafNodeSelection(selectedChild: any, ctx: any): Promise<any> {
  // Record the selection based on current phase
  if (currentPhase === 'products') {
    orderRecord.product_service_id = selectedChild.service_id;
    orderRecord.product_service_name = selectedChild.service_name;
    currentPhase = 'specifications';
  } else if (currentPhase === 'specifications') {
    orderRecord.specification_name = selectedChild.service_name;
    currentPhase = 'sizes';
  } else if (currentPhase === 'sizes') {
    orderRecord.size_name = selectedChild.service_name;
    currentPhase = 'quantities';
  } else if (currentPhase === 'quantities') {
    orderRecord.quantity_name = selectedChild.service_name;
    currentPhase = 'confirmation';
  }
  
  // Reset navigation state for next phase
  currentServiceId = null;
  serviceStack = [];
  
  // Load options for the new phase
  return await loadPhaseOptions(ctx);
}

// Helper to create order from compiled data
async function createOrderFromCompilation(ctx: any): Promise<any> {
  const sessionCustomerId =
    typeof ctx.customerId === 'string' && ctx.customerId.length === 36
      ? ctx.customerId
      : getCurrentCustomerId();

  // Block if not signed in / invalid customer id
  if (typeof sessionCustomerId !== 'string' || sessionCustomerId.length !== 36 || sessionCustomerId === '00000000-0000-0000-0000-000000000000') {
    return {
      messages: [
        { role: 'printy', text: 'You need to sign in before placing an order. Please sign in and try again.' },
      ],
      quickReplies: ['End Chat'],
    };
  }

  const order: OrderData = {
    order_id: crypto.randomUUID(),
    service_id: orderRecord.product_service_id || '1001',
    customer_id: sessionCustomerId,
    order_status: 'pending',
    delivery_mode: typeof ctx.deliveryMode === 'string' ? ctx.deliveryMode : 'pickup',
    order_date_time: new Date().toISOString(),
    completed_date_time: null,
    specification: orderRecord.specification_name || 'Standard',
    page_size: orderRecord.size_name || 'Standard',
    quantity: orderRecord.quantity_name ? extractQuantityFromString(orderRecord.quantity_name) : 1,
    priority_level: typeof ctx.priorityLevel === 'number' ? ctx.priorityLevel : 1,
  };

  const result = await createOrder(order);
  if (!result.success) {
    const errorMessage = (result.error && (result.error.message || result.error.details)) || 'Unknown error';
    return {
      messages: [
        { role: 'printy', text: 'Sorry, we were unable to submit your order.' },
        { role: 'printy', text: `Reason: ${errorMessage}` },
      ],
      quickReplies: ['End Chat'],
    };
  }
  
  // Reset state
  dynamicMode = false;
  currentPhase = 'products';
  currentServiceId = null;
  serviceStack = [];
  orderRecord = {};
  cachedQuickReplies = ['End Chat'];

  return {
    messages: [
      { role: 'printy', text: "Perfect! Your order has been submitted successfully. We'll be in touch with a detailed quote within 2 hours." }
    ],
    quickReplies: ['End Chat'],
  };
}

export const placeOrderFlow: ChatFlow = {
  id: 'place-order',
  title: 'Place an Order',
  initial: () => {
    // reset state
    currentNodeId = 'place_order_start';
    dynamicMode = false;
    currentPhase = 'products';
    currentServiceId = null;
    serviceStack = [];
    cachedQuickReplies = [];
    orderRecord = {};
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
        return await handleBackNavigation(ctx);
      }

      // Handle phase-specific navigation
      return await handlePhaseNavigation(ctx, input);
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
      currentPhase = 'products';
      currentServiceId = null;
      serviceStack = [];
      orderRecord = {};
      
      // Load initial product options
      return await loadPhaseOptions(ctx);
    }

    // If user chose End Chat option in static menu
    if (currentNodeId === 'end') {
      return { messages: nodeToMessages(NODES[currentNodeId]), quickReplies: ['End Chat'] };
    }

    // Any other static nodes are no-ops in this dynamic setup
    const node = NODES[currentNodeId];
    const messages = nodeToMessages(node);
    const quickReplies = nodeQuickReplies(node);

    return { messages, quickReplies };
  },
};
