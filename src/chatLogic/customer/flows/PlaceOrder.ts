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
    answer: 'Thank upu for chatting with Printy! Have a great day. 👋',
    options: [],
  },
  track_order_options: {
    id: 'track_order_options',
    message: 'Great! Which order would you like to track?',
    options: [
      { label: 'Latest Order', next: 'track_latest_order' },
      { label: 'All Orders', next: 'track_all_orders' },
      { label: 'Use Order ID', next: 'track_by_id' },
      { label: 'Back', next: 'place_order_start' },
    ],
  },
  track_latest_order: {
    id: 'track_latest_order',
    message: '', // Message will be set dynamically
    options: [{ label: 'End Chat', next: 'end' }],
  },
  track_all_orders: {
    id: 'track_all_orders',
    message: '', // Message will be set dynamically
    options: [{ label: 'End Chat', next: 'end' }],
  },
  track_by_id: {
    id: 'track_by_id',
    message: 'Please enter the Order ID you would like to track.',
    options: [{ label: 'Back', next: 'track_order_options' }, { label: 'End Chat', next: 'end' }],
  },
  track_by_id_result: {
    id: 'track_by_id_result',
    message: '', // Message will be set dynamically
    options: [{ label: 'End Chat', next: 'end' }],
  }
};

let currentNodeId: keyof typeof NODES = 'place_order_start';

// Multi-phase navigation state
type NavigationPhase = 'products' | 'specifications' | 'sizes' | 'quantities' | 'confirmation';

let currentPhase: NavigationPhase = 'products';
let currentServiceId: string | null = null;
let serviceStack: string[] = [];
let dynamicMode = false;
let trackingMode = false;

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

// New temporary state to hold the details of the last placed order for quote checking
let lastPlacedOrder: (OrderData & { product_service_name?: string }) | null = null;

// Helper to extract numeric value from quantity strings like "1000 pages", "250 pages"
function extractQuantityFromString(quantityStr: string): number {
  const match = quantityStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

// --- Dynamic helpers (Unchanged logic for DB fetching) ---
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
  let children: any[] = [];
  let message: string = '';

  if (currentPhase === 'products') {
    children = await getTopLevelServices('products');
    message = 'We offer a variety of printing Services. What type are you interested in?';
  } else if (currentPhase === 'specifications') {
    children = await getTopLevelServices('specifications');
    const { service: parentService } = await getServiceDetails('SPEC');
    message = parentService?.description || 'Wonderful choice! Now, let\'s nail down the specifications. What works for you?';
  } else if (currentPhase === 'sizes') {
    children = await getTopLevelServices('sizes');
    const { service: parentService } = await getServiceDetails('SIZE');
    message = parentService?.description || 'Perfect! Now let\'s choose the size. What size do you need?';
  } else if (currentPhase === 'quantities') {
    children = await getTopLevelServices('quantities');
    const { service: parentService } = await getServiceDetails('QUAN');
    message = parentService?.description || 'Excellent! Finally, let\'s choose the quantity. How many do you need?';
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

    cachedQuickReplies = ['Confirm Order', 'Back', 'End Chat'];

    return {
      messages,
      quickReplies: cachedQuickReplies,
    };
  }

  cachedQuickReplies = children
    .map(c => ((c.service_name || c.service_id || '') as string).trim())
    .filter(name => name.length > 0);
  cachedQuickReplies = [...cachedQuickReplies, 'Back', 'End Chat'];

  return {
    messages: [{ role: 'printy', text: message }],
    quickReplies: cachedQuickReplies,
  };
}

// Helper to handle phase-specific navigation
async function handlePhaseNavigation(ctx: any, input: string): Promise<any> {
  const normalized = input.trim().toLowerCase();
  
  // End Chat is handled in the main respond function if not in confirmation
  if (normalized === 'end chat') {
      // Allow end chat unless we are in the confirmation phase right before placing the order
      if (currentPhase !== 'confirmation') {
         dynamicMode = false;
         currentNodeId = 'end';
         return {
            messages: nodeToMessages(NODES[currentNodeId]),
            quickReplies: nodeQuickReplies(NODES[currentNodeId]),
         };
      }
  }


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
    // Re-display options if input is invalid
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
  cachedQuickReplies = [...cachedQuickReplies, 'Back', 'End Chat'];

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

  // Reset navigation state and load options for the new phase
  currentServiceId = null;
  serviceStack = [];

  return await loadPhaseOptions(ctx);
}

// New helper function to perform the actual quote lookup when the user returns
async function checkQuoteStatus(orderId: string, orderData: (OrderData & { product_service_name?: string })): Promise<any> {
    // 1. Check for quote
    const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

    if (quoteError) {
        console.error('Error checking for quote:', quoteError);
    }
    
    // --- Quote Found: Display Full Details ---
    if (quoteData) {
        // Fetch customer details
        const { data: customerData } = await supabase
            .from('customers')
            .select('customer_name, customer_address, contact_info')
            .eq('customer_id', orderData.customer_id)
            .maybeSingle();

        // Placeholder for company details
        const companyName = 'Printy Solutions Inc.';
        const companyAddress = '123 Main St, Malolos, Bulacan';
        const companyContact = '+63 912 345 6789';

        const customerName = customerData?.customer_name || 'N/A';
        const customerAddress = customerData?.customer_address || 'N/A';
        const customerContact = customerData?.contact_info || 'N/A';

        // Format dates
        const quoteIssueDate = new Date(quoteData.quote_issue_datetime).toLocaleString();
        const quoteDueDate = new Date(quoteData.quote_due_datetime).toLocaleString();
        
        // Use initial_price for the displayed price
        const price = quoteData.initial_price ? `₱${quoteData.initial_price.toFixed(2)}` : 'N/A';

        const messages: BotMessage[] = [
            { role: 'printy', text: '✅ **QUOTATION ISSUED**' },
            { role: 'printy', text:
                `**Company Details**\n` +
                `Company Name: ${companyName}\n` +
                `Company Address: ${companyAddress}\n` +
                `Contact Info: ${companyContact}`
            },
            { role: 'printy', text:
                `**Quotation Details**\n` +
                `Quotation ID: ${quoteData.quote_id}\n` +
                `Quote issue date: ${quoteIssueDate}\n` +
                `Quote due date: ${quoteDueDate}`
            },
            { role: 'printy', text:
                `**Customer Info**\n` +
                `Customer Name: ${customerName}\n` +
                `Customer Address: ${customerAddress}\n` +
                `Contact info: ${customerContact}`
            },
            { role: 'printy', text:
                `**Printing Service Info**\n` +
                `Printing Service Name: ${orderData.product_service_name || 'N/A'}\n` +
                `Specification: ${orderData.specification || 'N/A'}\n` +
                `Size: ${orderData.page_size || 'N/A'}\n` +
                `Quantity: ${orderData.quantity || 'N/A'}\n\n` +
                `**Price:** ${price}`
            }
        ];
        
        // Clear lastPlacedOrder after quote is found
        lastPlacedOrder = null; 
        
        return {
            messages: messages,
            quickReplies: ['End Chat'], // Quote found, allow user to end chat
        };
    }
    
    // --- Quote Not Found: Display Pending Message ---
    const messages: BotMessage[] = [{
        role: 'printy',
        text: "🕒 **Quote Still Pending**\n\nWe haven't issued a quote for your order yet. We're working hard to get it to you within **2 business days**.\n\nYou can click **'Check Quote'** anytime to see if it's ready."
    }];
    
    return {
        messages: messages,
        quickReplies: ['Check Quote'], // Only check quote, NO end chat until quote is received
    };
}

// Helper to immediately confirm order and set up for quote checking
async function handleQuoteProcess(orderId: string, orderData: (OrderData & { product_service_name?: string })): Promise<any> {
    
    // Store data for later quote check
    lastPlacedOrder = orderData; 

    // Reset temporary order compilation state
    dynamicMode = false;
    currentPhase = 'products';
    currentServiceId = null;
    serviceStack = [];
    orderRecord = {};
    
    const messages: BotMessage[] = [{
        role: 'printy',
        text: "✅ **Order Submitted!**\n\nThank you. We'll be in touch with a detailed quote within **2 business days**.\n\nYou can click **'Check Quote'** anytime to see if it's ready."
    }];

    return {
        messages: messages,
        quickReplies: ['Check Quote'], // ONLY 'Check Quote' is visible here as instructed
    };
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

  // Compile final order data for submission
  const finalOrder: OrderData & { product_service_name?: string } = {
    order_id: crypto.randomUUID(),
    service_id: orderRecord.product_service_id || '1001',
    customer_id: sessionCustomerId,
    order_status: 'Needs Quote',
    delivery_mode: typeof ctx.deliveryMode === 'string' ? ctx.deliveryMode : 'pickup',
    order_date_time: new Date().toISOString(),
    completed_date_time: null,
    specification: orderRecord.specification_name || 'Standard',
    page_size: orderRecord.size_name || 'Standard',
    quantity: orderRecord.quantity_name ? extractQuantityFromString(orderRecord.quantity_name) : 1,
    priority_level: typeof ctx.priorityLevel === 'number' ? ctx.priorityLevel : 1,
    product_service_name: orderRecord.product_service_name, // Include for quote display later
  };

  const result = await createOrder(finalOrder);
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

  // Call the new quote handling process
  return await handleQuoteProcess(finalOrder.order_id, finalOrder);
}

// New helper functions for order tracking
async function handleTrackOrder(ctx: any, input: string): Promise<any> {
  const customerId = getCurrentCustomerId();
  if (!customerId || customerId === '00000000-0000-0000-0000-000000000000') {
    trackingMode = false;
    currentNodeId = 'place_order_start';
    return {
      messages: [{ role: 'printy', text: 'You need to sign in to track an order. Please sign in and try again.' }],
      quickReplies: ['End Chat'],
    };
  }

  const normalizedInput = input.trim().toLowerCase();

  // Handle common actions from any tracking state
  if (normalizedInput === 'end chat') {
    trackingMode = false;
    currentNodeId = 'end';
    return {
      messages: nodeToMessages(NODES[currentNodeId]),
      quickReplies: nodeQuickReplies(NODES[currentNodeId]),
    };
  }

  if (normalizedInput === 'place order') {
    trackingMode = false;
    dynamicMode = true;
    currentPhase = 'products';
    currentNodeId = 'place_order';
    return await loadPhaseOptions(ctx);
  }

  switch (normalizedInput) {
    case 'latest order':
      return await getLatestOrder(customerId);
    case 'all orders':
      return await getAllOrders(customerId);
    case 'use order id':
      currentNodeId = 'track_by_id';
      return {
        messages: nodeToMessages(NODES.track_by_id),
        quickReplies: nodeQuickReplies(NODES.track_by_id),
      };
    case 'back':
      trackingMode = false;
      currentNodeId = 'place_order_start';
      return {
        messages: nodeToMessages(NODES[currentNodeId]),
        quickReplies: nodeQuickReplies(NODES[currentNodeId]),
      };
    default:
      if (currentNodeId === 'track_by_id') {
        return await getOrderByID(input.trim());
      }
      return {
        messages: [{ role: 'printy', text: 'Please choose one of the options.' }],
        quickReplies: ['All Orders', 'Use Order ID', 'End Chat', 'Place Order'],
      };
  }
}

// New helper to get formatted status with description
function getDisplayStatus(status: string) {
  const descriptions: Record<string, string> = {
    'Needs Quote': 'A quote needs to be provided by the admin first.',
    'Awaiting Quote Approval': 'The admin has provided a quote and is awaiting your approval.',
    'Processing': 'The company is already processing the printing request.',
    'Awaiting Payment': 'Please send a valid, clear image of the proof of payment.',
    'Verifying Payment': 'Proof already sent to admin; the admin is currently reviewing the proof.',
    'For Delivery/Pick up': 'The product is now ready for delivery or pickup.',
    'Delivered': 'The product has been successfully delivered.',
    'Completed': 'The order is now completed, with successful payment and pickup/delivery.',
    'Cancelled': 'The order has been cancelled.'
  };

  const description = descriptions[status] || 'No description available.';
  return `Status: ${status}\nDescription: ${description}`;
}

async function getLatestOrder(customerId: string): Promise<any> {
  const { data, error } = await supabase
    .from('orders')
    .select('order_status, order_datetime, specification, page_size, quantity, printing_services(service_name)')
    .eq('customer_id', customerId)
    .order('order_datetime', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return {
      messages: [{ role: 'printy', text: 'No recent orders found for your account.' }],
      quickReplies: ['End Chat'],
    };
  }

  // @ts-ignore
  const serviceName = data.printing_services?.service_name || 'N/A';
  const statusWithDescription = getDisplayStatus(data.order_status);
  const orderMessage = `Product name: ${serviceName}\nspecification: ${data.specification || 'N/A'}\nsize: ${data.page_size || 'N/A'}\nquantity: ${data.quantity || 'N/A'}\n\n${statusWithDescription}\nordered date time: ${new Date(data.order_datetime).toLocaleString()}`;

  currentNodeId = 'track_latest_order';
  return {
    messages: [{ role: 'printy', text: orderMessage }],
    quickReplies: ['All Orders', 'Use Order ID', 'End Chat', 'Place Order'],
  };
}

async function getAllOrders(customerId: string): Promise<any> {
  const { data, error } = await supabase
    .from('orders')
    .select('order_status, order_datetime, specification, page_size, quantity, printing_services(service_name)')
    .eq('customer_id', customerId)
    .order('order_datetime', { ascending: false });

  if (error || !data || data.length === 0) {
    return {
      messages: [{ role: 'printy', text: 'No orders found for your account.' }],
      quickReplies: ['End Chat'],
    };
  }

  const ordersList = data.map((order: any) => {
    // @ts-ignore
    const serviceName = order.printing_services?.service_name || 'N/A';
    const statusWithDescription = getDisplayStatus(order.order_status);
    return `Product name: ${serviceName}\nspecification: ${order.specification || 'N/A'}\nsize: ${order.page_size || 'N/A'}\nquantity: ${order.quantity || 'N/A'}\n\n${statusWithDescription}\nordered date time: ${new Date(order.order_datetime).toLocaleString()}`;
  }).join('\n\n---\n\n'); // Added separator between orders
  
  const message = `Here are all your orders:\n\n${ordersList}`;

  currentNodeId = 'track_all_orders';
  return {
    messages: [{ role: 'printy', text: message }],
    quickReplies: ['End Chat', 'Place Order'],
  };
}

async function getOrderByID(orderId: string): Promise<any> {
  const { data, error } = await supabase
    .from('orders')
    .select('order_status, order_datetime, specification, page_size, quantity, printing_services(service_name)')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error || !data) {
    return {
      messages: [{ role: 'printy', text: `Sorry, I could not find an order with the ID: ${orderId}. Please try again.` }],
      quickReplies: ['Back', 'End Chat', 'Place Order'],
    };
  }

  // @ts-ignore
  const serviceName = data.printing_services?.service_name || 'N/A';
  const statusWithDescription = getDisplayStatus(data.order_status);
  const orderMessage = `Found order ${orderId}:\n\nProduct name: ${serviceName}\nspecification: ${data.specification || 'N/A'}\nsize: ${data.page_size || 'N/A'}\nquantity: ${data.quantity || 'N/A'}\n\n${statusWithDescription}\nordered date time: ${new Date(data.order_datetime).toLocaleString()}`;

  currentNodeId = 'track_by_id_result';
  return {
    messages: [{ role: 'printy', text: orderMessage }],
    quickReplies: ['End Chat', 'Place Order'],
  };
}


export const placeOrderFlow: ChatFlow = {
  id: 'place-order',
  title: 'Place an Order',
  initial: () => {
    // reset state
    currentNodeId = 'place_order_start';
    dynamicMode = false;
    trackingMode = false;
    currentPhase = 'products';
    currentServiceId = null;
    serviceStack = [];
    cachedQuickReplies = [];
    orderRecord = {};
    lastPlacedOrder = null; // Clear last placed order on flow restart
    return nodeToMessages(NODES[currentNodeId]);
  },
  quickReplies: () => {
    // If an order was recently placed but the quote hasn't been found, prioritize Check Quote
    if (lastPlacedOrder) {
        return ['Check Quote'];
    }
    
    if (dynamicMode) return cachedQuickReplies;
    if (trackingMode) return nodeQuickReplies(NODES[currentNodeId]);
    
    return nodeQuickReplies(NODES[currentNodeId]);
  },
  respond: async (ctx, input) => {
    const normalizedInput = input.trim().toLowerCase();

    // 1. Check for 'Check Quote' action (Highest priority after tracking mode)
    if (normalizedInput === 'check quote') {
        if (lastPlacedOrder) {
            // Temporarily disable tracking/dynamic mode while checking quote
            trackingMode = false;
            dynamicMode = false;
            return await checkQuoteStatus(lastPlacedOrder.order_id, lastPlacedOrder);
        } else {
            return {
                messages: [{ role: 'printy', text: "I don't have a recent order to check the quote for. Please place an order or check via the tracking option." }],
                quickReplies: ['Place Order', 'Track Order', 'End Chat'],
            };
        }
    }

    // 2. If we're in tracking mode, handle tracking logic first
    if (trackingMode) {
        if (currentNodeId === 'track_by_id') {
            const normalizedInput = input.trim();
            if (normalizedInput.toLowerCase() === 'back') {
                currentNodeId = 'track_order_options';
                return {
                    messages: nodeToMessages(NODES[currentNodeId]),
                    quickReplies: nodeQuickReplies(NODES[currentNodeId]),
                };
            }
            return await getOrderByID(normalizedInput);
        }
        return await handleTrackOrder(ctx, input);
    }

    // 3. If in dynamic mode, handle DB-driven navigation
    if (dynamicMode) {
      const normalized = input.trim().toLowerCase();

      // Handle Back navigation
      if (normalized === 'back') {
        return await handleBackNavigation(ctx);
      }
      
      // Handle End Chat if user is NOT in the final 'confirmation' phase
      if (normalized === 'end chat' && currentPhase !== 'confirmation') {
         dynamicMode = false;
         currentNodeId = 'end';
         return {
            messages: nodeToMessages(NODES[currentNodeId]),
            quickReplies: nodeQuickReplies(NODES[currentNodeId]),
         };
      }


      // Handle phase-specific navigation
      return await handlePhaseNavigation(ctx, input);
    }

    // 4. Static mode for initial choice only
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

    // When user selects 'Track Order', switch to the new tracking branch
    if (currentNodeId === 'track_order') {
        trackingMode = true;
        currentNodeId = 'track_order_options';
    }

    // If user chose End Chat option in static menu
    if (currentNodeId === 'end') {
      return { messages: nodeToMessages(NODES[currentNodeId]), quickReplies: ['End Chat'] };
    }

    // All other static nodes
    const node = NODES[currentNodeId];
    const messages = nodeToMessages(node);
    const quickReplies = nodeQuickReplies(node);

    return { messages, quickReplies };
  },
};