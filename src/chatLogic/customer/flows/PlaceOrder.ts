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
  // --- NEW NODES FOR QUOTE NEGOTIATION ---
  quote_negotiation: {
    id: 'quote_negotiation',
    message: 'Your quote is ready. Please review the details above and select an option to proceed.',
    // NOTE: Options are now dynamic, this node is just a static label/anchor
    options: [],
  },
  confirm_quote: {
    id: 'confirm_quote',
    answer: '✅ Quote Confirmed! Please proceed to the dashboard or your account page to settle the payment for this order. Thank you for choosing Printy! 👋',
    options: [], // Ends the chat
  },
  modified_quote_submitted: {
    id: 'modified_quote_submitted',
    // This node is no longer used to end the chat, but is kept for consistency if needed later.
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

// New state variable to track if the original quote has been altered by the user
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
    remarks?: string; // Add remarks field to the cached order
    proposed_price?: number; // Add proposed price field
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
    const children = await getTopLevelServices('products');
    cachedQuickReplies = children
      .map(c => ((c.service_name || c.service_id || '') as string).trim())
      .filter(name => name.length > 0);
    cachedQuickReplies = [...cachedQuickReplies, 'Back'];

    return {
      messages: [
        {
          role: 'printy',
          text: 'We offer a variety of printing Services. What type are you interested in?',
        },
      ],
      quickReplies: cachedQuickReplies,
    };
  } else if (currentPhase === 'specifications') {
    const children = await getTopLevelServices('specifications');
    cachedQuickReplies = children
      .map(c => ((c.service_name || c.service_id || '') as string).trim())
      .filter(name => name.length > 0);
    cachedQuickReplies = [...cachedQuickReplies, 'Back'];

    return {
      messages: [
        {
          role: 'printy',
          text: "Great! Now let's choose the specifications. What would you like?",
        },
      ],
      quickReplies: cachedQuickReplies,
    };
  } else if (currentPhase === 'sizes') {
    const children = await getTopLevelServices('sizes');
    cachedQuickReplies = children
      .map(c => ((c.service_name || c.service_id || '') as string).trim())
      .filter(name => name.length > 0);
    cachedQuickReplies = [...cachedQuickReplies, 'Back'];

    return {
      messages: [
        {
          role: 'printy',
          text: "Perfect! Now let's choose the size. What size do you need?",
        },
      ],
      quickReplies: cachedQuickReplies,
    };
  } else if (currentPhase === 'quantities') {
    const children = await getTopLevelServices('quantities');
    cachedQuickReplies = children
      .map(c => ((c.service_name || c.service_id || '') as string).trim())
      .filter(name => name.length > 0);
    cachedQuickReplies = [...cachedQuickReplies, 'Back'];

    return {
      messages: [
        {
          role: 'printy',
          text: "Excellent! Finally, let's choose the quantity. How many do you need?",
        },
      ],
      quickReplies: cachedQuickReplies,
    };


  } else if (currentPhase === 'confirmation') {
    // Step 4: Confirmation screen
    const messages: BotMessage[] = [
      { role: 'printy', text: '📋 Order Summary' },
      {
        role: 'printy',
        text: `🖨️ Product: ${orderRecord.product_service_name || 'N/A'}`,
      },
      {
        role: 'printy',
        text: `⚙️ Specification: ${orderRecord.specification_name || 'N/A'}`,
      },
      { role: 'printy', text: `📏 Size: ${orderRecord.size_name || 'N/A'}` },
      {
        role: 'printy',
        text: `📦 Quantity: ${orderRecord.quantity_name || 'N/A'}`,
      },
      {
        role: 'printy',
        text: 'Please review your order details above. If everything looks correct, click "Confirm Order" to proceed.',
      },
    ];

    cachedQuickReplies = ['Confirm Order', 'Back', 'End Chat'];

    return {
      messages,
      quickReplies: cachedQuickReplies,
    };
  }

  cachedQuickReplies = children
    .map(c => {
      const name = (c.service_name || c.service_id || '') as string;
      return name.trim();
    })
    .filter(name => name.length > 0);
    
  // Only show 'Back' if not at the root level of the product tree (currentServiceId === null)
  const navigationOptions = [...cachedQuickReplies];
  if (currentPhase !== 'products' || currentServiceId !== null || serviceStack.length > 0) {
    navigationOptions.push('Back');
  }
  navigationOptions.push('End Chat');
  cachedQuickReplies = navigationOptions;


  return {
    messages: [{ role: 'printy', text: message }],
    quickReplies: cachedQuickReplies,
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
    // Fallthrough to invalid input if not confirm/back
  }
  
  // Handle 'Back' in dynamic mode if it wasn't handled as part of confirmation
  if (normalized === 'back') {
    return await handleBackNavigation(ctx);
  }

  // Handle 'End Chat' in dynamic mode if user is NOT in the final 'confirmation' phase
  if (normalized === 'end chat' && currentPhase !== 'confirmation') {
      dynamicMode = false;
      currentNodeId = 'end';
      return {
        messages: nodeToMessages(NODES[currentNodeId]),
        quickReplies: nodeQuickReplies(NODES[currentNodeId]),
     };
  }

  // Find selected child (currentServiceId will be null for product root, 'SPEC' for spec phase, etc.)
  const { children } = await getServiceDetails(currentServiceId);
  const selectedChild = children.find(c => {
    const name = (c.service_name || c.service_id || '')
      .toString()
      .toLowerCase();
    return name === normalized;
  });

  if (!selectedChild) {
    // Re-display options if input is invalid
    return {
      messages: [{ role: 'printy', text: 'Please choose one of the options.' }],
      quickReplies: cachedQuickReplies,
    };
  }
  
  // If the phase is not 'products', it must be a leaf node (fixed phases)
  if (currentPhase !== 'products') {
    // Fixed phases (Spec, Size, Qty) are assumed to be leaf nodes in this structure
    return await handleLeafNodeSelection(selectedChild, ctx);
  }

  // We are in the 'products' phase (Step 2: recursive)


  const { service: nextService, children: nextChildren } =
    await getServiceDetails(currentServiceId);



  // If no children, this is a product leaf node - record product and move to next fixed phase (Spec)
  if (nextChildren.length === 0) {
    // Record the product selection
    orderRecord.product_service_id = selectedChild.service_id;
    orderRecord.product_service_name = selectedChild.service_name;

    // Check if we are in the 'Edit Product Selected' flow
    if (dynamicMode && lastPlacedOrder && currentPhase === 'products') {
        // 1. Update the lastPlacedOrder with the newly selected product
        lastPlacedOrder.service_id = orderRecord.product_service_id || lastPlacedOrder.service_id;
        lastPlacedOrder.product_service_name = orderRecord.product_service_name || lastPlacedOrder.product_service_name;
        
        // 2. Set the quote as modified
        quoteModified = true;

        // 3. Reset dynamic mode and return to the quote negotiation node
        dynamicMode = false;
        currentNodeId = 'quote_negotiation';

        // 4. Re-display the updated quote for confirmation/re-negotiation
        return await checkQuoteStatus(lastPlacedOrder.order_id, lastPlacedOrder);
    }

    // Standard flow: Transition to the next fixed phase (Specifications)
    currentPhase = 'specifications'; 
    currentServiceId = null;
    serviceStack = [];
    return await loadPhaseOptions(ctx);
  }

  // This is an intermediate node (category/type) in the product tree. Drill down.
  if (currentServiceId) serviceStack.push(currentServiceId);
  currentServiceId = selectedChild.service_id as string;

  // Map and filter for quick replies
  cachedQuickReplies = nextChildren
    .map(c => {
      const name = (c.service_name || c.service_id || '') as string;
      return name.trim();
    })
    .filter(name => name.length > 0);
  cachedQuickReplies = [...cachedQuickReplies, 'Back', 'End Chat'];

  const messages = dbToMessages(
    nextService,
    'Great choice! What would you like to choose next?'
  );

  return { messages, quickReplies: cachedQuickReplies };
}

// Helper to handle leaf node selection and phase transition
async function handleLeafNodeSelection(
  selectedChild: any,
  ctx: any
): Promise<any> {
  // Record the selection based on current phase

  if (currentPhase === 'products') {
    throw new Error("Product leaf node selection should be handled in handlePhaseNavigation.");
  } else if (currentPhase === 'specifications') {
    orderRecord.specification_name = selectedChild.service_name;
    currentPhase = 'sizes';
  } else if (currentPhase === 'sizes') {
    orderRecord.size_name = selectedChild.service_name;
    currentPhase = 'quantities';
  } else if (currentPhase === 'quantities') {
    orderRecord.quantity_name = selectedChild.service_name;
    
    // Check if we came from the 'Edit Product Details' flow
    if (dynamicMode && lastPlacedOrder) {
        // We have completed editing the product details (Spec, Size, Qty).
        
        // 1. Update the lastPlacedOrder with the new details (Simulate DB update)
        lastPlacedOrder.specification = orderRecord.specification_name ?? '';
        lastPlacedOrder.page_size = orderRecord.size_name ?? '';
        lastPlacedOrder.quantity = extractQuantityFromString(orderRecord.quantity_name || '');
        
        // 2. Set the quote as modified
        quoteModified = true;

        // 3. Reset dynamic mode and return to the quote negotiation node
        dynamicMode = false;
        currentNodeId = 'quote_negotiation';
        
        // 4. Re-display the updated quote for confirmation/re-negotiation
        return await checkQuoteStatus(lastPlacedOrder.order_id, lastPlacedOrder);
    }

    // If not editing an existing quote, proceed to confirmation
    currentPhase = 'confirmation';
  }


  // Reset navigation state for next phase
  currentServiceId = null;
  serviceStack = [];

  // Load options for the new phase

  return await loadPhaseOptions(ctx);
}

// Helper function to perform the actual quote lookup when the user returns
async function checkQuoteStatus(orderId: string, orderData: (OrderData & { product_service_name?: string; remarks?: string; proposed_price?: number })): Promise<any> {
    // 1. Check for quote
    // In a real implementation, we would re-fetch the quote from the database
    const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

    if (quoteError) {
        console.error('Error checking for quote:', quoteError);
    }
    
    // --- Quote Found: Display Full Details (Step 5) ---
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
        
        // Use initial_price for the displayed price, and display proposed price if modified
        const originalPrice = quoteData.initial_price ? `₱${quoteData.initial_price.toFixed(2)}` : 'N/A';
        const finalPriceDisplay = orderData.proposed_price ? 
            `~~${originalPrice}~~ | **Proposed Price: ₱${orderData.proposed_price.toFixed(2)}**` : 
            originalPrice;
        
        const remarksDisplay = orderData.remarks ? `\n\n📝 **Customer Remarks:** ${orderData.remarks}` : '';

        const messages: BotMessage[] = [
            { role: 'printy', text: `✅ QUOTATION ISSUED (Order ID: ${orderId})` },
            { role: 'printy', text:
                `Company Details\n` +
                `Company Name: ${companyName}\n` +
                `Company Address: ${companyAddress}\n` +
                `Contact Info: ${companyContact}`
            },
            { role: 'printy', text:
                `Quotation Details\n` +
                `Quotation ID: ${quoteData.quote_id}\n` +
                `Quote issue date: ${quoteIssueDate}\n` +
                `Quote due date: ${quoteDueDate}`
            },
            { role: 'printy', text:
                `Customer Info\n` +
                `Customer Name: ${customerName}\n` +
                `Customer Address: ${customerAddress}\n` +
                `Contact info: ${customerContact}`
            },
            { role: 'printy', text:
                `Printing Service Info\n` +
                `Printing Service Name: ${orderData.product_service_name || 'N/A'}\n` +
                `Specification: ${orderData.specification || 'N/A'}\n` +
                `Size: ${orderData.page_size || 'N/A'}\n` +
                `Quantity: ${orderData.quantity || 'N/A'}${remarksDisplay}` +
                `\n\n**Total Price: ${finalPriceDisplay}**`
            }
        ];
        
        // Determine the primary confirmation button based on modification status
        const confirmOption = quoteModified
            ? 'Submit Modified Quotation' 
            : 'Accept and Confirm Order';

        const negotiationOptions = [
            confirmOption,
            'Edit Product Selected',
            'Edit Product Details',
            'Negotiate Pricing',
            'Add Remarks',
        ];
        
        // Set negotiation node and return options (Step 6)
        currentNodeId = 'quote_negotiation';
        dynamicMode = false; // Turn off dynamic mode while in static negotiation node
        
        return {
            messages: messages,
            quickReplies: negotiationOptions,
        };
    }
    
    // --- Quote Not Found: Display Pending Message ---
    const messages: BotMessage[] = [{
        role: 'printy',
        text: "🕒 Quote Still Pending\n\nWe haven't issued a quote for your order yet. We're working hard to get it to you within 2 business days.\n\nYou can click 'Check Quote' anytime to see if it's ready."
    }];
    
    return {
        messages: messages,
        quickReplies: ['Check Quote'], // Only check quote
    };
}

// Helper to immediately confirm order and set up for quote checking
async function handleQuoteProcess(orderId: string, orderData: (OrderData & { product_service_name?: string })): Promise<any> {
    
    // Store data for later quote check
    lastPlacedOrder = orderData; 
    quoteModified = false; // Initial quote is not modified by the user

    // Reset temporary order compilation state
    dynamicMode = false;
    currentPhase = 'products';
    currentServiceId = null;
    serviceStack = [];
    orderRecord = {};
    
    const messages: BotMessage[] = [{
        role: 'printy',
        text: `✅ Order Submitted (ID: ${orderId})!\n\nThank you. We'll be in touch with a detailed quote within 2 business days.\n\nYou can click 'Check Quote' anytime to see if it's ready.`
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
  if (
    typeof sessionCustomerId !== 'string' ||
    sessionCustomerId.length !== 36 ||
    sessionCustomerId === '00000000-0000-0000-0000-000000000000'
  ) {
    return {
      messages: [
        {
          role: 'printy',
          text: 'You need to sign in before placing an order. Please sign in and try again.',
        },
      ],
      quickReplies: ['End Chat'],
    };
  }

  // Compile final order data for submission
  const finalOrder: OrderData & { product_service_name?: string } = {
    order_id: crypto.randomUUID(),
    service_id: orderRecord.product_service_id || '1001',
    customer_id: sessionCustomerId,
    order_status: 'pending',
    delivery_mode:
      typeof ctx.deliveryMode === 'string' ? ctx.deliveryMode : 'pickup',

    order_date_time: new Date().toISOString(),
    completed_date_time: null,
    specification: orderRecord.specification_name || 'Standard',
    page_size: orderRecord.size_name || 'Standard',
    quantity: orderRecord.quantity_name
      ? extractQuantityFromString(orderRecord.quantity_name)
      : 1,
    priority_level:
      typeof ctx.priorityLevel === 'number' ? ctx.priorityLevel : 1,

  };

  const result = await createOrder(finalOrder);
  if (!result.success) {
    const errorMessage =
      (result.error && (result.error.message || result.error.details)) ||
      'Unknown error';
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

// --- QUOTE NEGOTIATION HANDLER (Step 6) ---
async function handleNegotiation(ctx: any, input: string): Promise<any> {
    const normalizedInput = input.trim().toLowerCase();
    
    // Check if there is an active order to negotiate
    if (!lastPlacedOrder) {
        currentNodeId = 'place_order_start';
        return {
            messages: [{ role: 'printy', text: "I don't have a recent order quote to negotiate. Please start a new order." }],
            quickReplies: nodeQuickReplies(NODES[currentNodeId]),
        };
    }

    // --- Price Submission Logic (negotiate_price_input) ---
    if (currentNodeId === 'negotiate_price_input') {
        const proposedPrice = parseFloat(input.trim().replace(/[^0-9.]/g, ''));
        
        // Handle Back from negotiation_price_input
        if (normalizedInput === 'back to negotiation' || normalizedInput === 'end chat') {
             // If back or end chat, just return to negotiation without setting modification
            currentNodeId = 'quote_negotiation';
            return await checkQuoteStatus(lastPlacedOrder.order_id, lastPlacedOrder);
        }

        if (isNaN(proposedPrice) || proposedPrice <= 0) {
            return {
                messages: [{ role: 'printy', text: 'That is not a valid price. Please enter a positive number for your proposed alternative price.' }],
                quickReplies: nodeQuickReplies(NODES.negotiate_price_input),
            };
        }
        
        // 1. Store the proposed price
        lastPlacedOrder.proposed_price = proposedPrice;
        
        // 2. Set the quote as modified
        quoteModified = true;

        // 3. Return to quote display
        currentNodeId = 'quote_negotiation';
        return await checkQuoteStatus(lastPlacedOrder.order_id, lastPlacedOrder);
    }
    
    // --- Remarks Submission Logic (add_remarks_input) ---
    if (currentNodeId === 'add_remarks_input') {
        
        // Handle Back from add_remarks_input
        if (normalizedInput === 'back to negotiation' || normalizedInput === 'end chat') {
             // If back or end chat, just return to negotiation without setting modification
            currentNodeId = 'quote_negotiation';
            return await checkQuoteStatus(lastPlacedOrder.order_id, lastPlacedOrder);
        }
        
        // 1. Store the remarks
        lastPlacedOrder.remarks = input.trim();
        
        // 2. Set the quote as modified
        quoteModified = true;

        // 3. Return to quote display
        currentNodeId = 'quote_negotiation';
        return await checkQuoteStatus(lastPlacedOrder.order_id, lastPlacedOrder);
    }


    // --- Handle options from the negotiation menu (quote_negotiation) ---
    switch (normalizedInput) {
        
        // Dynamic Confirmation Button:
        case 'accept and confirm order':
            if (quoteModified) {
                 return {
                    messages: [{ role: 'printy', text: 'You have modified the quote. Please select **"Submit Modified Quotation"** or undo your changes.' }],
                    // This returns to the dynamic quickReplies in the export which will re-render the options
                    quickReplies: [], 
                };
            }
            // Logic for "Accept and Confirm Order"
            // **TODO: Implement API call to update order status to 'Quote Confirmed'**
            
            // Critical change: Accept/Confirm ends the chat
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
                    // This returns to the dynamic quickReplies in the export which will re-render the options
                    quickReplies: [], 
                };
            }
            // Logic for "Submit Modified Quotation"
            // **TODO: Implement API call to resubmit quote details for admin review (Status: 'Needs Quote')**
            
            // Critical change: Submitting modified quote returns to the waiting loop
            const orderId = lastPlacedOrder.order_id;
            const resubmittedOrderData = lastPlacedOrder; // Use the modified data for the re-submit
            
            // 1. Simulate setting the order back to 'Needs Quote'
            // In a real flow, this would be an API call
            
            // 2. Clear quote state to force 'Pending' message
            // Note: lastPlacedOrder is kept to retain the modified data
            
            // 3. Reset modification status for the new, pending quote
            quoteModified = false; 
            
            // 4. Return the initial order submission confirmation/waiting message
            return await handleQuoteProcess(orderId, resubmittedOrderData);


        case 'edit product selected': // Step 6a: Return to Step 2 (Product tree root)
            dynamicMode = true;
            currentPhase = 'products';
            currentServiceId = null;
            serviceStack = [];
            // Re-populate orderRecord with current values 
            orderRecord.product_service_name = lastPlacedOrder.product_service_name; 
            
            currentNodeId = 'place_order'; 
            
            return await loadPhaseOptions(ctx);

        case 'edit product details': // Step 6b: Return to Step 3 (Specifications phase)
            dynamicMode = true;
            currentPhase = 'specifications';
            currentServiceId = null;
            serviceStack = [];
            // Re-populate orderRecord with current values
            orderRecord.product_service_id = lastPlacedOrder.service_id;
            orderRecord.product_service_name = lastPlacedOrder.product_service_name;
            
            currentNodeId = 'place_order'; 

            return await loadPhaseOptions(ctx);

        case 'negotiate pricing': // Step 6c: Ask for price input
            currentNodeId = 'negotiate_price_input';
            return {
                messages: nodeToMessages(NODES[currentNodeId]),
                quickReplies: nodeQuickReplies(NODES[currentNodeId]),
            };
            
        case 'add remarks': // New Option: Ask for remarks text input
            currentNodeId = 'add_remarks_input';
            return {
                messages: nodeToMessages(NODES[currentNodeId]),
                quickReplies: nodeQuickReplies(NODES[currentNodeId]),
            };
            
        default:
            // This returns to the dynamic quickReplies in the export which will re-render the options
            return await checkQuoteStatus(lastPlacedOrder.order_id, lastPlacedOrder);
    }
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
    .select('order_id, order_status, order_datetime, specification, page_size, quantity, printing_services(service_name)')
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
  const orderMessage = `Order ID: ${data.order_id}\nProduct name: ${serviceName}\nspecification: ${data.specification || 'N/A'}\nsize: ${data.page_size || 'N/A'}\nquantity: ${data.quantity || 'N/A'}\n\n${statusWithDescription}\nordered date time: ${new Date(data.order_datetime).toLocaleString()}`;

  currentNodeId = 'track_latest_order';
  return {
    messages: [{ role: 'printy', text: orderMessage }],
    quickReplies: ['All Orders', 'Use Order ID', 'End Chat', 'Place Order'],
  };
}

async function getAllOrders(customerId: string): Promise<any> {
  const { data, error } = await supabase
    .from('orders')
    .select('order_id, order_status, order_datetime, specification, page_size, quantity, printing_services(service_name)')
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
    return `Order ID: ${order.order_id}\nProduct name: ${serviceName}\nspecification: ${order.specification || 'N/A'}\nsize: ${order.page_size || 'N/A'}\nquantity: ${order.quantity || 'N/A'}\n\n${statusWithDescription}\nordered date time: ${new Date(order.order_datetime).toLocaleString()}`;
  }).join('\n\n---\n\n'); 
  
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
    .select('order_id, order_status, order_datetime, specification, page_size, quantity, printing_services(service_name)')
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
    quoteModified = false; // Reset modification status
    return nodeToMessages(NODES[currentNodeId]);
  },
  quickReplies: () => {
    // 1. If an order was recently placed but the quote hasn't been found, prioritize Check Quote
    if (lastPlacedOrder && currentNodeId !== 'quote_negotiation' && currentNodeId !== 'negotiate_price_input' && currentNodeId !== 'add_remarks_input') {
        return ['Check Quote'];
    }
    
    // 2. If in negotiation mode, dynamically generate options
    if (currentNodeId === 'quote_negotiation') {
        const confirmOption = quoteModified
            ? 'Submit Modified Quotation' 
            : 'Accept and Confirm Order';

        return [
            confirmOption,
            'Edit Product Selected',
            'Edit Product Details',
            'Negotiate Pricing',
            'Add Remarks',
        ];
    }
    
    // 3. Dynamic mode (product/spec selection)
    if (dynamicMode) return cachedQuickReplies;
    
    // 4. Input collection mode (price/remarks)
    if (currentNodeId === 'negotiate_price_input' || currentNodeId === 'add_remarks_input') {
        // Return only the back/end options defined in the node (since they require text input)
        return nodeQuickReplies(NODES[currentNodeId]).filter(label => label.toLowerCase() !== 'back to negotiation');
    }
    
    // 5. Tracking/Static mode
    if (trackingMode) return nodeQuickReplies(NODES[currentNodeId]);
    
    return nodeQuickReplies(NODES[currentNodeId]);
  },
  respond: async (ctx, input) => {
    const normalizedInput = input.trim().toLowerCase();

    // 1. Check for 'Check Quote' action (Highest priority)
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

    // 2. Check for Negotiation State (Step 6)
    if (currentNodeId === 'quote_negotiation' || currentNodeId === 'negotiate_price_input' || currentNodeId === 'add_remarks_input') {
        return await handleNegotiation(ctx, input);
    }
    
    // 3. If in dynamic mode, handle DB-driven navigation (This must come before static flow check)
    if (dynamicMode) {
      // Handle phase-specific navigation (includes Back/End Chat checks)
      return await handlePhaseNavigation(ctx, input);
    }

    // 4. If we're in tracking mode, handle tracking logic first
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

    // 5. Static mode for initial choice only
    const current = NODES[currentNodeId];
    const selection = current.options.find(
      o => o.label.toLowerCase() === input.trim().toLowerCase()
    );
    if (!selection) {
      return {
        messages: [
          { role: 'printy', text: 'Please choose one of the options.' },
        ],
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
      return {
        messages: nodeToMessages(NODES[currentNodeId]),
        quickReplies: ['End Chat'],
      };
    }

    // All other static nodes
    const node = NODES[currentNodeId];
    const messages = nodeToMessages(node);
    const quickReplies = nodeQuickReplies(node);

    return { messages, quickReplies };
  },
};