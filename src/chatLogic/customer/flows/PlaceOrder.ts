// PlaceOrder.ts

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
      { label: 'Track Order', next: 'track_order_options' }, 
      { label: 'End Chat', next: 'end' },
    ],
  },
  place_order: {
    id: 'place_order',
    question: 'Place Order',
    answer:
      'We offer a variety of printing Services. What type are you interested in?',
    options: [
      { label: 'End Chat', next: 'end' },
    ],
  },
  track_order: {
    id: 'track_order',
    answer:
      'Order tracking is not yet available here. Please use the Track Order page.',
    options: [{ label: 'End Chat', next: 'end' }],
  },
  end: {
    id: 'end',
    answer: 'Thank for chatting with Printy! Have a great day. 👋',
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
  },
  // --- NODES FOR QUOTE NEGOTIATION ---
  quote_negotiation: {
    id: 'quote_negotiation',
    message: 'Your quote is ready. Please review the details above and select an option to proceed.',
    options: [],
  },
  confirm_quote: {
    id: 'confirm_quote',
    answer: '✅ Quote Confirmed! Please proceed to the dashboard or your account page to settle the payment for this order. Thank you for choosing Printy! 👋',
    options: [], 
  },
  modified_quote_submitted: {
    id: 'modified_quote_submitted',
    answer: '✅ Modified Quotation Submitted! We will review your changes and send a new quote shortly. This chat will now end. 👋',
    options: [], 
  },
  negotiate_price_input: {
    id: 'negotiate_price_input',
    message: 'Please enter the alternative price you would like to propose.',
    options: [
      { label: 'Back to Negotiation', next: 'quote_negotiation' },
      { label: 'End Chat', next: 'end' },
    ],
  },
  add_remarks_input: {
    id: 'add_remarks_input',
    message: 'Please enter any additional **Remarks** or special instructions for your order.',
    options: [
      { label: 'Back to Negotiation', next: 'quote_negotiation' },
      { label: 'End Chat', next: 'end' },
    ],
  },
};

let currentNodeId: keyof typeof NODES = 'place_order_start';


// Multi-phase navigation state
type NavigationPhase =
  | 'products'
  | 'specifications'
  | 'sizes'
  | 'quantities'
  | 'confirmation';


let currentPhase: NavigationPhase = 'products';
let currentServiceId: string | null = null;
let serviceStack: string[] = [];
let dynamicMode = false;
let trackingMode = false;
let quoteModified = false;

// Cache for synchronous quickReplies API
let cachedQuickReplies: string[] = [];

// Store order details progressively
let orderRecord: Partial<
  OrderData & {
    product_service_id?: string;
    product_service_name?: string;
    specification_name?: string;
    size_name?: string;
    quantity_name?: string;
  }
> = {};


// State to hold the details of the last placed order for quote checking/negotiation
let lastPlacedOrder: (OrderData & { 
    product_service_name?: string;
    remarks?: string; 
    proposed_price?: number; 
}) | null = null;



// Helper to extract numeric value from quantity strings like "1000 pages", "250 pages"
function extractQuantityFromString(quantityStr: string): number {
  const match = quantityStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

// --- Dynamic helpers (DB fetching) ---
async function getServiceDetails(serviceId: string | null): Promise<{
  service: any | null;
  children: any[];
}> {
  if (!serviceId) {

    try {
      const { data: authUser } = await supabase.auth.getUser();
      console.log(
        '[PlaceOrder] Auth user for root fetch:',
        authUser?.user?.id || 'none'
      );
    } catch {}
    // First: strictly NULL parents (no active_status filter to avoid mismatches)
    const nullParents = await supabase

      .from('printing_services')
      .select('*')
      .or('parent_service_id.is.null,parent_service_id.eq.""') 
      .order('service_name', { ascending: true });
    if (nullParents.error) {
      console.error(
        'Error fetching services (null parent):',
        nullParents.error
      );
      return { service: null, children: [] };
    }
    let rows = nullParents.data || [];
    if (!rows.length) {
      console.warn(
        '[PlaceOrder] Root fetch returned 0 rows (NULL parent). Retrying with empty string parent...'
      );
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
      console.warn(
        '[PlaceOrder] Root fetch still 0 rows. Final retry without any parent filter normalization...'
      );
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

  // Logic for fetching children of a specific serviceId (serviceId is NOT null)
  const { data, error } = await supabase
    .from('printing_services')
    .select('*') 
    .eq('parent_service_id', serviceId)
    .order('service_name', { ascending: true });

  if (error) {
    console.error('Error fetching service details:', error);
    // Check if the serviceId itself exists (it might be a leaf node with no children)
    const { data: serviceData } = await supabase
      .from('printing_services')
      .select('*')
      .eq('service_id', serviceId)
      .maybeSingle();
    
    return { service: serviceData, children: [] };
  }
  
  // Find the parent service itself
  const { data: serviceData } = await supabase
    .from('printing_services')
    .select('*')
    .eq('service_id', serviceId)
    .maybeSingle();
  

  return { service: serviceData, children: data || [] };
}

function dbToMessages(service: any, fallback?: string): BotMessage[] {
  if (service?.description)
    return [{ role: 'printy', text: service.description }];
  if (fallback) return [{ role: 'printy', text: fallback }];
  if (service?.service_name)
    return [
      { role: 'printy', text: `You have selected ${service.service_name}.` },
    ];
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
async function getTopLevelServices(
  category: 'products' | 'specifications' | 'sizes' | 'quantities'
): Promise<any[]> {
  const categoryMap = {
    products: ['PRNT', 'DIGI', 'PACK', 'LARG'],
    specifications: ['SPEC'],
    sizes: ['SIZE'],
    quantities: ['QUAN'],
  };

  const serviceIds = categoryMap[category];
  
  // Return the children of the parent ID
  const { children } = await getServiceDetails(serviceIds[0]);
  return children;
}

// Helper to handle back navigation across phases
async function handleBackNavigation(ctx: any): Promise<any> {
  if (currentPhase === 'products') {
    // If in products phase, try to go up one level in the product tree
    if (serviceStack.length > 0) {
      currentServiceId = serviceStack.pop() || null;
      // Reload options for the previous level
      const { service: parentService, children } = await getServiceDetails(currentServiceId);
      
      cachedQuickReplies = children
        .map(c => {
          const name = (c.service_name || c.service_id || '') as string;
          return name.trim();
        })
        .filter(name => name.length > 0);
      cachedQuickReplies = [...cachedQuickReplies, 'Back', 'End Chat'];

      const message = parentService?.description || 'Please choose from the options below.';
      return {
        messages: [{ role: 'printy', text: message }],
        quickReplies: cachedQuickReplies,
      };

    } else {
      // If at the root of products, exit dynamic mode and go to start menu
      dynamicMode = false;
      currentNodeId = 'place_order_start';
      return {
        messages: nodeToMessages(NODES[currentNodeId]),
        quickReplies: nodeQuickReplies(NODES[currentNodeId]),
      };
    }
  }

  // Move to previous phase
  const phaseOrder: NavigationPhase[] = [
    'products',
    'specifications',
    'sizes',
    'quantities',
    'confirmation',
  ];

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
    const { children: productChildren, service: parentService } = await getServiceDetails(currentServiceId);
    children = productChildren;
    message = parentService?.description || 'We offer a variety of printing Services. What type are you interested in?';
    
  } else if (currentPhase === 'specifications') {
    // FIX 1: Use type assertion to avoid assignment error due to union type inference
    children = await getTopLevelServices('specifications' as 'specifications');
    message = "Great! Now let's choose the specifications. What would you like?";
    
  } else if (currentPhase === 'sizes') {
    // FIX 1: Use type assertion
    children = await getTopLevelServices('sizes' as 'sizes');
    message = "Perfect! Now let's choose the size. What size do you need?";
    
  } else if (currentPhase === 'quantities') {
    // FIX 1: Use type assertion
    children = await getTopLevelServices('quantities' as 'quantities');
    message = "Excellent! Finally, let's choose the quantity. How many do you need?";
    
  } else if (currentPhase === 'confirmation') {
    // Step 4: Confirmation screen
    const messages: BotMessage[] = [
      { role: 'printy', text: `Please confirm your order details:` },
      {
        role: 'printy',
        text: `**Product:** ${orderRecord.product_service_name || 'N/A'}\n**Specification:** ${orderRecord.specification_name || 'N/A'}\n**Size:** ${orderRecord.size_name || 'N/A'}\n**Quantity:** ${orderRecord.quantity_name || 'N/A'}`,
      },
    ];

    cachedQuickReplies = ['Confirm Order', 'Back', 'End Chat'];

    return {
      messages: messages,
      quickReplies: cachedQuickReplies,
    };
  }

  // Generate quick replies from children
  cachedQuickReplies = children
    .map(c => (c.service_name || c.service_id || '').trim())
    .filter(name => name.length > 0);
  
  if (currentPhase !== 'products' || serviceStack.length > 0) {
    cachedQuickReplies = [...cachedQuickReplies, 'Back'];
  }
  cachedQuickReplies = [...cachedQuickReplies, 'End Chat'];

  return {
    messages: [{ role: 'printy', text: message }],
    quickReplies: cachedQuickReplies,
  };
}

// Helper to handle the selection of a phase option (service, spec, size, qty)
async function handlePhaseSelection(
  _ctx: any, // FIX 2: Renamed ctx to _ctx to remove unused variable warning
  input: string,
  children: any[]
): Promise<any> {
  const selectedService = children.find(
    c => (c.service_name || c.service_id).toLowerCase() === input.toLowerCase()
  );

  if (!selectedService) {
    return invalidInput();
  }

  const serviceId = selectedService.service_id;
  const serviceName = selectedService.service_name;

  if (currentPhase === 'products') {
    // Check if the selected product has children (drill down)
    const { children: grandChildren, service: currentService } = await getServiceDetails(serviceId);

    if (grandChildren && grandChildren.length > 0) {
      // Drill down: push currentServiceId to stack, set new ID, reload options
      if (currentServiceId) serviceStack.push(currentServiceId);
      currentServiceId = serviceId;
      
      const messages = dbToMessages(currentService);
      cachedQuickReplies = grandChildren
        .map(c => (c.service_name || c.service_id || '').trim())
        .filter(name => name.length > 0);
      cachedQuickReplies = [...cachedQuickReplies, 'Back', 'End Chat'];

      return {
        messages: messages,
        quickReplies: cachedQuickReplies,
      };

    } else {
      // Leaf node selected (actual product)
      orderRecord.product_service_id = serviceId;
      orderRecord.product_service_name = serviceName;
      currentPhase = 'specifications';
      currentServiceId = null; // Reset for next phase
      serviceStack = [];
      return await loadPhaseOptions(_ctx); // Updated call site
    }

  } else if (currentPhase === 'specifications') {
    orderRecord.specification_name = serviceName;
    orderRecord.specification = serviceName;
    currentPhase = 'sizes';
    return await loadPhaseOptions(_ctx); // Updated call site

  } else if (currentPhase === 'sizes') {
    orderRecord.size_name = serviceName;
    orderRecord.page_size = serviceName;
    currentPhase = 'quantities';
    return await loadPhaseOptions(_ctx); // Updated call site

  } else if (currentPhase === 'quantities') {
    orderRecord.quantity_name = serviceName;
    orderRecord.quantity = extractQuantityFromString(serviceName);
    currentPhase = 'confirmation';
    return await loadPhaseOptions(_ctx); // Updated call site
  }
  
  return invalidInput();
}


// --- New V2 Logic: Quote Negotiation ---

function getNegotiationOptions(modified: boolean): string[] {
    const baseOptions = ['Accept and Confirm Order', 'Propose Alternative Price', 'Add/Edit Remarks', 'Edit Product Details', 'End Chat'];
    
    // Only show 'Submit Modified Quotation' if a field has been changed
    if (modified) {
        return ['Submit Modified Quotation', ...baseOptions];
    }
    
    return baseOptions;
}

async function handleQuoteProcess(orderId: string, orderData: any): Promise<any> {
    lastPlacedOrder = {
        ...orderData,
        order_id: orderId,
        remarks: orderData.remarks || '',
        proposed_price: orderData.proposed_price || null,
    };
    quoteModified = orderData.proposed_price || orderData.remarks ? true : false; 
    currentNodeId = 'quote_negotiation';
    return await checkQuoteStatus(orderId);
}

async function checkQuoteStatus(orderId: string): Promise<any> {
        const { data: order, error } = await supabase
        .from('orders')
        .select(`*, quotes:quotes(initial_price, negotiated_price, quote_issue_datetime, quote_due_datetime)`)
        .eq('order_id', orderId)
        .maybeSingle();
        
    if (error || !order || !order.quotes || order.quotes.length === 0) {
        // If no quote, redirect to a waiting state or simple end.
        currentNodeId = 'end';
        return {
            messages: [{ role: 'printy', text: 'Order submitted! We are currently working on your quote and will notify you soon.' }],
            quickReplies: ['End Chat'],
        };
    }
    
    const quote = order.quotes[0];
    const quotedPrice = quote.negotiated_price || quote.initial_price;

    const messages: BotMessage[] = [
        { role: 'printy', text: `Order ID: ${orderId}` },
        { 
            role: 'printy', 
            text: `**Product:** ${order.product_service_name || 'N/A'}\n**Details:** ${order.specification}, ${order.page_size}, ${order.quantity}\n**Quote Price:** ${quotedPrice ? `₱${quotedPrice.toFixed(2)}` : 'Awaiting Quote'}\n**Remarks:** ${order.remarks || 'None'}`,
        }
    ];
    
    // If quote has been modified by user, highlight the proposed changes
    if (quoteModified) {
        if (lastPlacedOrder?.proposed_price) {
            messages.push({ role: 'printy', text: `You have proposed the following changes:`});
            messages.push({ role: 'printy', text: `- **Proposed Price:** $${lastPlacedOrder.proposed_price.toFixed(2)}`});
        }
        if (lastPlacedOrder?.remarks) {
            messages.push({ role: 'printy', text: `- **New Remarks:** ${lastPlacedOrder.remarks}`});
        }
    }

    const quickReplies = getNegotiationOptions(quoteModified);

    return {
        messages: messages.concat(nodeToMessages(NODES.quote_negotiation)),
        quickReplies: quickReplies,
    };
}


async function handleNegotiation(ctx: any, input: string): Promise<any> {
    const normalized = input.trim().toLowerCase();

    // 1. Initial Null Check
    if (!lastPlacedOrder) {
        currentNodeId = 'end';
        return {
            messages: [{ role: 'printy', text: 'Error: Session data for the last order has expired. Please restart the flow.' }],
            quickReplies: nodeQuickReplies(NODES[currentNodeId]),
        };
    }
    
    // FIX 2: Using the Non-Null Assertion (!) resolves the error at line 514
    const currentOrder = lastPlacedOrder!; 
    
    // Check if waiting for price or remarks input
    if (currentNodeId === 'negotiate_price_input') {
        const price = parseFloat(input.trim());
        if (isNaN(price) || price <= 0) {
            return {
                messages: [{ role: 'printy', text: 'Please enter a valid positive number for the price.' }],
                quickReplies: nodeQuickReplies(NODES.negotiate_price_input),
            };
        }
        currentOrder.proposed_price = price; 
        quoteModified = true;
        currentNodeId = 'quote_negotiation';
        return await checkQuoteStatus(currentOrder.order_id);
    }

    if (currentNodeId === 'add_remarks_input') {
        const remarks = input.trim();
        currentOrder.remarks = remarks; 
        quoteModified = true;
        currentNodeId = 'quote_negotiation';
        return await checkQuoteStatus(currentOrder.order_id);
    }
    
    // Check quick reply options
    switch (normalized) {
        case 'back to negotiation':
            currentNodeId = 'quote_negotiation';
            return await checkQuoteStatus(currentOrder.order_id);
            
        case 'propose alternative price':
            currentNodeId = 'negotiate_price_input';
            return {
                messages: nodeToMessages(NODES[currentNodeId]),
                quickReplies: nodeQuickReplies(NODES[currentNodeId]),
            };
            
        case 'add/edit remarks':
            currentNodeId = 'add_remarks_input';
            return {
                messages: nodeToMessages(NODES[currentNodeId]),
                quickReplies: nodeQuickReplies(NODES[currentNodeId]),
            };
            
        case 'edit product details': // Step 6b: Return to Products selection phase
            dynamicMode = true;
            currentPhase = 'products'; // FIX 3: Change to 'products' to restart the phase flow
            currentServiceId = null;
            serviceStack = [];
            orderRecord = {}; // Reset order details for a new product selection
            currentNodeId = 'place_order'; 

            // Immediately load the next phase and return the result.
            return await loadPhaseOptions(ctx);

        case 'accept and confirm order':
            if (quoteModified) {
                return {
                    messages: [{ role: 'printy', text: 'You have modified the quote. Please select **"Submit Modified Quotation"** or undo your changes.' }],
                    quickReplies: getNegotiationOptions(quoteModified), 
                };
            }
            // Implement API call to update order status
            const { error: updateError } = await supabase
                .from('orders')
                .update({ order_status: 'Awaiting Payment' })
                .eq('order_id', currentOrder.order_id); 

            if (updateError) console.error('Error confirming quote:', updateError);
            
            lastPlacedOrder = null; 
            currentNodeId = 'confirm_quote';
            return {
                messages: nodeToMessages(NODES[currentNodeId]),
                quickReplies: nodeQuickReplies(NODES[currentNodeId]),
            };
            
        case 'submit modified quotation':
            if (!quoteModified) {
                return {
                    messages: [{ role: 'printy', text: 'The quote has not been modified. Please select **"Accept and Confirm Order"**.' }],
                    quickReplies: getNegotiationOptions(quoteModified), 
                };
            }
            // Implement API call to update order with modified details
            const orderId = currentOrder.order_id;
            
            const { error: resubmitError } = await supabase
                .from('orders')
                .update({ 
                    order_status: 'Needs Quote', 
                    // Use the original service_id/spec/size/qty stored in the local cache
                    service_id: currentOrder.service_id, 
                    specification: currentOrder.specification,
                    page_size: currentOrder.page_size,
                    quantity: currentOrder.quantity,
                    remarks: currentOrder.remarks,
                    proposed_price: currentOrder.proposed_price, 
                })
                .eq('order_id', orderId);

            if (resubmitError) console.error('Error resubmitting quote:', resubmitError);

            // Clear the local quote modified state
            quoteModified = false; 
            lastPlacedOrder = null;
            currentNodeId = 'modified_quote_submitted'; // Transition to end node for modified submission
            
            return {
                messages: nodeToMessages(NODES[currentNodeId]),
                quickReplies: nodeQuickReplies(NODES[currentNodeId]),
            };
            
        default:
            return invalidInput();
    }
}

// --- New V2 Logic: Order Tracking ---

async function getDisplayStatus(order: any): Promise<{ statusText: string }> {
    const quote = order.quotes && order.quotes.length > 0 ? order.quotes[0] : null;
    const quotedPrice = quote ? (quote.negotiated_price || quote.initial_price) : null;
    let statusText = `Order ID: **${order.order_id}**\nStatus: **${order.order_status}**\nProduct: ${order.product_service_name || 'N/A'}\nDate: ${new Date(order.order_datetime).toLocaleDateString()}`;

    if (quotedPrice) {
        statusText += `\nQuoted Price: ₱${quotedPrice.toFixed(2)}`;
    }
    
    cachedQuickReplies = ['End Chat'];

    return { statusText };
}

async function getLatestOrder(customerId: string): Promise<any> {
    const { data: order, error } = await supabase
        .from('orders')
        .select(`*, quotes:quotes(initial_price, negotiated_price, quote_issue_datetime, quote_due_datetime)`)
        .eq('customer_id', customerId)
        .order('order_datetime', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !order) {
        currentNodeId = 'track_latest_order';
        return {
            messages: [{ role: 'printy', text: 'Could not find your latest order or an error occurred.' }],
            quickReplies: ['Back', 'End Chat'],
        };
    }

    currentNodeId = 'track_latest_order';
    const { statusText } = await getDisplayStatus(order);
    
    return {
        messages: [{ role: 'printy', text: statusText }],
        quickReplies: cachedQuickReplies,
    };
}

async function getAllOrders(customerId: string): Promise<any> {
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`*, quotes:quotes(initial_price, negotiated_price, quote_issue_datetime, quote_due_datetime)`)
        .eq('customer_id', customerId)
        .order('order_datetime', { ascending: false });

    if (error || !orders || orders.length === 0) {
        currentNodeId = 'track_all_orders';
        return {
            messages: [{ role: 'printy', text: 'You have no orders or an error occurred.' }],
            quickReplies: ['Back', 'End Chat'],
        };
    }

    const messages = orders.map((order, index) => ({
        role: 'printy',
        text: `**${index + 1}.** Order ID: **${order.order_id}** | Status: **${order.order_status}** | Date: ${new Date(order.order_datetime).toLocaleDateString()}`,
    }));

    currentNodeId = 'track_all_orders';
    return {
        messages: [{ role: 'printy', text: `Found ${orders.length} orders:` }, ...messages],
        quickReplies: ['Back', 'End Chat'],
    };
}

async function getOrderByID(orderId: string, customerId: string): Promise<any> {
    const { data: order, error } = await supabase
        .from('orders')
        .select(`*, quotes:quotes(initial_price, negotiated_price, quote_issue_datetime, quote_due_datetime)`)
        .eq('order_id', orderId)
        .eq('customer_id', customerId)
        .maybeSingle();

    if (error || !order) {
        currentNodeId = 'track_by_id';
        return {
            messages: [{ role: 'printy', text: `Could not find order **${orderId}** under your account.` }],
            quickReplies: ['Back', 'End Chat'],
        };
    }

    currentNodeId = 'track_by_id_result';
    const { statusText } = await getDisplayStatus(order);

    return {
        messages: [{ role: 'printy', text: statusText }],
        quickReplies: cachedQuickReplies,
    };
}

async function handleTrackOrder(_ctx: any, input: string): Promise<any> {
    const normalizedInput = input.trim().toLowerCase();
    const customerId = getCurrentCustomerId();
    
    if (!customerId) {
        trackingMode = false;
        return {
            messages: [{ role: 'printy', text: 'You must be signed in to track orders.' }],
            quickReplies: nodeQuickReplies(NODES.place_order_start),
        };
    }

    let trackingResponse: any = null;

    // Handle static navigation options first
    if (normalizedInput === 'back') {
        if (currentNodeId === 'track_by_id' || currentNodeId === 'track_by_id_result') {
             currentNodeId = 'track_order_options';
        } else if (currentNodeId === 'track_order_options') {
            trackingMode = false;
            currentNodeId = 'place_order_start';
        } else {
            currentNodeId = 'track_order_options';
        }
        
        return {
            messages: nodeToMessages(NODES[currentNodeId]),
            quickReplies: nodeQuickReplies(NODES[currentNodeId]),
        };
    }

    // Handle tracking mode commands
    switch (normalizedInput) {
        case 'latest order':
            trackingResponse = await getLatestOrder(customerId);
            break;
        case 'all orders':
            trackingResponse = await getAllOrders(customerId);
            break;
        case 'use order id':
            currentNodeId = 'track_by_id';
            trackingResponse = {
                messages: nodeToMessages(NODES[currentNodeId]),
                quickReplies: nodeQuickReplies(NODES[currentNodeId]),
            };
            break;
        default:
            // Explicitly handle text input when the bot is waiting for an Order ID
            if (currentNodeId === 'track_by_id') {
                trackingResponse = await getOrderByID(input.trim(), customerId);
            } else {
                // Fallback for invalid input in tracking mode
                trackingResponse = invalidInput();
            }
            break;
    }
    
    return trackingResponse;
}


function invalidInput(): { messages: BotMessage[]; quickReplies: string[] } {
  return {
    messages: [
      {
        role: 'printy',
        text: "Sorry, I don't understand. Please choose from the options.",
      },
    ],
    quickReplies:
      cachedQuickReplies && cachedQuickReplies.length > 0
        ? cachedQuickReplies
        : ['End Chat'],
  };
}


async function createOrderFromCompilation(_ctx: any): Promise<any> { 
    const customerId = getCurrentCustomerId();
    if (!customerId) {
        return {
            messages: [{ role: 'printy', text: 'You must be signed in to place an order.' }],
            quickReplies: ['End Chat'],
        };
    }

    // Generate unique order ID using UUID format to match database
    const orderId = crypto.randomUUID();
    const currentDateTime = new Date().toISOString();
    
    // Prepare order data according to OrderData interface
    const compiledOrder: OrderData = {
        order_id: orderId,
        service_id: orderRecord.product_service_id!,
        customer_id: customerId,
        order_status: 'Needs Quote',
        delivery_mode: 'Pickup', // Default delivery mode
        order_date_time: currentDateTime,
        completed_date_time: null,
        specification: orderRecord.specification!,
        page_size: orderRecord.page_size!,
        quantity: orderRecord.quantity!,
        priority_level: 1, // Default priority level
    }; 

    const { data: order, error } = await createOrder(compiledOrder);

    // Reset state after order submission
    dynamicMode = false;
    currentPhase = 'products';
    orderRecord = {};
    serviceStack = [];
    currentServiceId = null;

    if (error || !order) {
        currentNodeId = 'end';
        return {
            messages: [{ role: 'printy', text: 'Sorry, your order could not be placed due to an error. Please try again later.' }],
            quickReplies: nodeQuickReplies(NODES[currentNodeId]),
        };
    }

    // Order successfully placed, now initiate quote negotiation flow (V2)
    return await handleQuoteProcess(order.order_id, order);
}


export const placeOrderFlow: ChatFlow = {
  id: 'place-order',
  title: 'Place an Order',
  initial: (_ctx: any) => {
    // Reset all state variables on new flow start
    currentNodeId = 'place_order_start';
    dynamicMode = false;
    trackingMode = false;
    currentPhase = 'products';
    currentServiceId = null;
    serviceStack = [];
    orderRecord = {};
    lastPlacedOrder = null;
    quoteModified = false;
    cachedQuickReplies = nodeQuickReplies(NODES[currentNodeId]);

    return nodeToMessages(NODES[currentNodeId]);
  },
  quickReplies: () => cachedQuickReplies,
  respond: async (ctx, input) => {
    const normalizedInput = input.trim().toLowerCase();

    // Global End Chat check
    if (normalizedInput === 'end chat') {
        currentNodeId = 'end';
        return {
            messages: nodeToMessages(NODES[currentNodeId]),
            quickReplies: nodeQuickReplies(NODES[currentNodeId]),
        };
    }

    // 1. If we're in negotiation mode, handle negotiation logic first
    if (lastPlacedOrder) {
        return await handleNegotiation(ctx, input);
    }
    
    // 2. If we're in dynamic mode, handle phase navigation
    if (dynamicMode) {
      if (normalizedInput === 'back') {
        return await handleBackNavigation(ctx);
      } else if (currentPhase === 'confirmation' && normalizedInput === 'confirm order') {
        return await createOrderFromCompilation(ctx);
      }

      let children: any[] = [];
      if (currentPhase === 'products') {
        const result = await getServiceDetails(currentServiceId);
        children = result.children;
      } else {
        children = await getTopLevelServices(currentPhase as 'specifications' | 'sizes' | 'quantities'); // Type assertion for safe use
      }
      return await handlePhaseSelection(ctx, input, children);
    }
    
    // 3. If we're in tracking mode, handle tracking logic
    if (trackingMode) {
        return await handleTrackOrder(ctx, input);
    }

    // 4. Handle static navigation and transitions
    const nextNode = NODES[currentNodeId].options.find(
      o => o.label.toLowerCase() === normalizedInput
    );

    if (nextNode) {
      currentNodeId = nextNode.next as keyof typeof NODES;

      if (currentNodeId === 'place_order') {
        dynamicMode = true;
        currentPhase = 'products';
        return await loadPhaseOptions(ctx);
      }
      
      if (currentNodeId === 'track_order_options') {
        trackingMode = true;
        cachedQuickReplies = nodeQuickReplies(NODES[currentNodeId]);
        return {
            messages: nodeToMessages(NODES[currentNodeId]),
            quickReplies: cachedQuickReplies,
        };
      }
      
      
      // Default static node transition
      cachedQuickReplies = nodeQuickReplies(NODES[currentNodeId]);
      return {
        messages: nodeToMessages(NODES[currentNodeId]),
        quickReplies: cachedQuickReplies,
      };
    }

    // 5. Invalid Input Fallback
    return invalidInput();
  },
};