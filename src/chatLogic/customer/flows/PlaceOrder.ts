// PlaceOrder.ts

import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { createOrder } from '../../../api/orderApi';
import type { OrderData } from '../../../api/orderApi';
import { getCurrentCustomerId } from '../../../lib/utils';
import { supabase } from '../../../lib/supabase';
// FIX: Removed 'quoteModified' to clear unused value warning.
import { 
    handleTrackOrder, 
    handleQuoteChecking, 
    handleNegotiation,
    lastPlacedOrder,  
    setLastPlacedOrder,
    setQuoteModified
} from './OrderTracking'; 


// --- 1. SHARED TYPES & NODE DEFINITIONS ---

export type Option = { label: string; next: string };
export type Node = {
    id: string;
    message?: string;
    question?: string;
    answer?: string;
    options: Option[];
};

export type NavigationPhase =
    | 'products'
    | 'specifications'
    | 'sizes'
    | 'quantities'
    | 'confirmation';

// State to store order details progressively (Exported for OrderTracking to update if user edits product details)
export let orderRecord: Partial<
    OrderData & {
        product_service_id?: string;
        product_service_name?: string;
        specification_name?: string;
        size_name?: string;
        quantity_name?: string;
    }
> = {};

export const NODES: Record<string, Node> = {
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
        answer: 'Thank for chatting with Printy! Have a great day.',
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
        message: '', 
        options: [{ label: 'End Chat', next: 'end' }],
    },
    track_all_orders: {
        id: 'track_all_orders',
        message: '', 
        options: [{ label: 'End Chat', next: 'end' }],
    },
    track_by_id: {
        id: 'track_by_id',
        message: 'Please enter the Order ID you would like to track.',
        options: [{ label: 'Back', next: 'track_order_options' }, { label: 'End Chat', next: 'end' }],
    },
    track_by_id_result: {
        id: 'track_by_id_result',
        message: '', 
        options: [{ label: 'End Chat', next: 'end' }],
    },
    // Quote nodes handled by OrderTracking, but defined here for global access
    awaiting_quote: {
        id: 'awaiting_quote',
        message: 'Order submitted! We are currently working on your quote and will notify you soon. This can take up to **2 business days**.',
        options: [
            { label: 'Check Quote Status', next: 'check_quote_status' },
            { label: 'End Chat', next: 'end' },
        ],
    },
    quote_not_ready: {
        id: 'quote_not_ready',
        message: '', 
        options: [
            { label: 'Check Quote Status', next: 'check_quote_status' },
            { label: 'End Chat', next: 'end' },
        ],
    },
    check_quote_status: {
        id: 'check_quote_status',
        message: 'Checking the database for your quote...',
        options: [],
    },
    quote_negotiation: {
        id: 'quote_negotiation',
        message: 'Your quote is ready. Please review the details above and select an option to proceed.',
        options: [],
    },
    confirm_quote: {
        id: 'confirm_quote',
        answer: 'Quote Confirmed! Please proceed to the dashboard or your account page to settle the payment for this order. Thank thank you for choosing Printy!',
        options: [],
    },
    modified_quote_submitted: {
        id: 'modified_quote_submitted',
        answer: 'Modified Quotation Submitted! We will review your changes and send a new quote shortly. This chat will now end.',
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


// --- 2. LOCAL & SHARED STATE MANAGEMENT ---

export let currentNodeId: keyof typeof NODES = 'place_order_start';
export let currentPhase: NavigationPhase = 'products';
export let currentServiceId: string | null = null;
export let serviceStack: string[] = [];
export let dynamicMode = false;
export let trackingMode = false;
export let cachedQuickReplies: string[] = [];

// State Setter for OrderTracking to modify the local flow state
export const setFlowState = (
    newCurrentNodeId?: keyof typeof NODES, 
    newDynamicMode?: boolean,
    newCurrentPhase?: NavigationPhase,
    newCurrentServiceId?: string | null,
    newServiceStack?: string[]
) => {
    if (newCurrentNodeId) currentNodeId = newCurrentNodeId;
    if (newDynamicMode !== undefined) dynamicMode = newDynamicMode;
    if (newCurrentPhase) currentPhase = newCurrentPhase;
    if (newCurrentServiceId !== undefined) currentServiceId = newCurrentServiceId;
    if (newServiceStack) serviceStack = newServiceStack;
};

// State Setter for resetting orderRecord
export const resetOrderRecord = () => {
    orderRecord = {};
}


// --- 3. UTILITY FUNCTIONS ---

function extractQuantityFromString(quantityStr: string): number {
    const match = quantityStr.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
}

function nodeToMessages(node: Node): BotMessage[] {
    if (node.message) return [{ role: 'printy', text: node.message }];
    if (node.answer) return [{ role: 'printy', text: node.answer }];
    return [];
}

function nodeQuickReplies(node: Node): string[] {
    return node.options.map(o => o.label);
}

// REMOVED: function dbToMessages - to clear unused function warning.

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

function generateOrderId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 9);
    return `ORD-${timestamp}${randomPart}`.toUpperCase();
}


// --- 4. DATA FETCHING (DB) FUNCTIONS ---

async function getServiceDetails(serviceId: string | null): Promise<{
    service: any | null;
    children: any[];
}> {
    if (!serviceId) {
        const { data: rows, error } = await supabase
            .from('printing_services')
            .select('*')
            .or('parent_service_id.is.null,parent_service_id.eq.""')
            .order('service_name', { ascending: true });
        
        if (error) {
            console.error('Error fetching root services:', error);
            return { service: null, children: [] };
        }
        return { service: null, children: rows || [] };
    }

    const { data: children, error: childrenError } = await supabase
        .from('printing_services')
        .select('*')
        .eq('parent_service_id', serviceId)
        .order('service_name', { ascending: true });

    const { data: serviceData } = await supabase
        .from('printing_services')
        .select('*')
        .eq('service_id', serviceId)
        .maybeSingle();

    if (childrenError) console.error('Error fetching service children:', childrenError);

    return { service: serviceData, children: children || [] };
}

async function getTopLevelServices(
    category: 'products' | 'specifications' | 'sizes' | 'quantities'
): Promise<any[]> {
    const categoryMap = {
        products: ['PRNT'], 
        specifications: ['SPEC'],
        sizes: ['SIZE'],
        quantities: ['QUAN'],
    };

    // Assumes PRNT, SPEC, SIZE, QUAN are root parents and we need their children
    const parentId = categoryMap[category][0];
    const { children } = await getServiceDetails(parentId);
    return children;
}


// --- 5. NAVIGATION LOGIC ---

export async function loadPhaseOptions(_ctx: any): Promise<any> {
    let children: any[] = [];
    let message: string = '';

    if (currentPhase === 'products') {
        const { children: productChildren, service: parentService } = await getServiceDetails(currentServiceId);
        children = productChildren;
        message = parentService?.description || 'We offer a variety of printing Services. What type are you interested in?';

    } else if (currentPhase === 'specifications') {
        children = await getTopLevelServices('specifications');
        message = "Great! Now let's choose the specifications. What would you like?";

    } else if (currentPhase === 'sizes') {
        children = await getTopLevelServices('sizes');
        message = "Perfect! Now let's choose the size. What size do you need?";

    } else if (currentPhase === 'quantities') {
        children = await getTopLevelServices('quantities');
        message = "Excellent! Finally, let's choose the quantity. How many do you need?";

    } else if (currentPhase === 'confirmation') {
        const messages: BotMessage[] = [
            { role: 'printy', text: `Please confirm your order details:` },
            {
                role: 'printy',
                text: `**Product:** ${orderRecord.product_service_name || 'N/A'}\n**Specification:** ${orderRecord.specification_name || 'N/A'}\n**Size:** ${orderRecord.size_name || 'N/A'}\n**Quantity:** ${orderRecord.quantity_name || 'N/A'}`,
            },
        ];

        cachedQuickReplies = ['Confirm Order', 'Back', 'End Chat'];

        return { messages: messages, quickReplies: cachedQuickReplies };
    }

    cachedQuickReplies = children
        .map(c => (c.service_name || c.service_id || '').trim())
        .filter(name => name.length > 0);

    // Only show Back if not at the root of the first phase
    if (currentPhase !== 'products' || serviceStack.length > 0) {
        cachedQuickReplies = [...cachedQuickReplies, 'Back'];
    }
    cachedQuickReplies = [...cachedQuickReplies, 'End Chat'];

    return {
        messages: [{ role: 'printy', text: message }],
        quickReplies: cachedQuickReplies,
    };
}

export async function handleBackNavigation(ctx: any): Promise<any> {
    if (currentPhase === 'products') {
        if (serviceStack.length > 0) {
            currentServiceId = serviceStack.pop() || null;
            return await loadPhaseOptions(ctx);
        } else {
            dynamicMode = false;
            currentNodeId = 'place_order_start';
            return {
                messages: nodeToMessages(NODES[currentNodeId]),
                quickReplies: nodeQuickReplies(NODES[currentNodeId]),
            };
        }
    }

    const phaseOrder: NavigationPhase[] = ['products', 'specifications', 'sizes', 'quantities', 'confirmation'];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    
    if (currentIndex > 0) {
        currentPhase = phaseOrder[currentIndex - 1];
    }

    currentServiceId = null;
    serviceStack = [];
    return await loadPhaseOptions(ctx);
}

export async function handlePhaseSelection(
    _ctx: any, 
    input: string,
    children: any[]
): Promise<any> {
    const selectedService = children.find(
        c => (c.service_name || c.service_id).toLowerCase() === input.toLowerCase()
    );

    if (!selectedService) return invalidInput();

    const serviceId = selectedService.service_id;
    const serviceName = selectedService.service_name;

    if (currentPhase === 'products') {
        const { children: grandChildren } = await getServiceDetails(serviceId);

        if (grandChildren && grandChildren.length > 0) {
            if (currentServiceId) serviceStack.push(currentServiceId);
            currentServiceId = serviceId;
            return await loadPhaseOptions(_ctx); 
        } else {
            // Leaf node selected: move to next phase
            orderRecord.product_service_id = serviceId;
            orderRecord.product_service_name = serviceName;
            currentPhase = 'specifications';
            currentServiceId = null;
            serviceStack = [];
            return await loadPhaseOptions(_ctx); 
        }

    } else if (currentPhase === 'specifications') {
        orderRecord.specification_name = serviceName;
        orderRecord.specification = serviceName;
        currentPhase = 'sizes';
        return await loadPhaseOptions(_ctx); 

    } else if (currentPhase === 'sizes') {
        orderRecord.size_name = serviceName;
        orderRecord.page_size = serviceName;
        currentPhase = 'quantities';
        return await loadPhaseOptions(_ctx); 

    } else if (currentPhase === 'quantities') {
        orderRecord.quantity_name = serviceName;
        orderRecord.quantity = extractQuantityFromString(serviceName);
        currentPhase = 'confirmation';
        return await loadPhaseOptions(_ctx); 
    }

    return invalidInput();
}


// --- 6. CORE ORDER SUBMISSION ---

async function createOrderFromCompilation(_ctx: any): Promise<any> {
    const customerId = getCurrentCustomerId();
    if (!customerId) {
        currentNodeId = 'end';
        return {
            messages: [{ role: 'printy', text: 'You must be signed in to place an order.' }],
            quickReplies: nodeQuickReplies(NODES[currentNodeId]),
        };
    }

    const orderId = generateOrderId();
    const currentDateTime = new Date().toISOString();

    const compiledOrder: OrderData = {
        order_id: orderId,
        service_id: orderRecord.product_service_id!,
        customer_id: customerId,
        order_status: 'Needs Quote',
        delivery_mode: 'Pickup', 
        order_date_time: currentDateTime, 
        completed_date_time: null, 
        specification: orderRecord.specification!,
        page_size: orderRecord.page_size!,
        quantity: orderRecord.quantity!,
        priority_level: 1, 
    };

    const { data: order, error } = await createOrder(compiledOrder);

    // Reset flow state
    dynamicMode = false;
    currentPhase = 'products';
    resetOrderRecord(); 
    serviceStack = [];
    currentServiceId = null;

    if (error || !order) {
        currentNodeId = 'end';
        return {
            messages: [{ role: 'printy', text: 'Sorry, your order could not be placed due to an error. Please try again later.' }],
            quickReplies: nodeQuickReplies(NODES[currentNodeId]),
        };
    }

    // Order placed: transition to quote checking flow via OrderTracking logic
    setLastPlacedOrder({ 
        ...(order as any), 
        order_id: order.order_id, 
        remarks: null, 
        proposed_price: null 
    });
    setQuoteModified(false);
    
    // Set node and immediately check quote status
    setFlowState('awaiting_quote'); 
    return await handleQuoteChecking(order.order_id);
}


// --- 7. CHATFLOW EXPORT ---

export const placeOrderFlow: ChatFlow = {
    id: 'place-order',
    title: 'Place an Order',
    initial: (_ctx: any) => {
        // Reset ALL state on initial call
        setFlowState('place_order_start', false, 'products', null, []);
        trackingMode = false;
        resetOrderRecord();
        setLastPlacedOrder(null);
        setQuoteModified(false);

        cachedQuickReplies = nodeQuickReplies(NODES[currentNodeId]);
        return nodeToMessages(NODES[currentNodeId]);
    },
    quickReplies: () => cachedQuickReplies,
    respond: async (ctx, input) => {
        const normalizedInput = input.trim().toLowerCase();

        // 7.1. Global Exit
        if (normalizedInput === 'end chat') {
            currentNodeId = 'end';
            return {
                messages: nodeToMessages(NODES[currentNodeId]),
                quickReplies: nodeQuickReplies(NODES[currentNodeId]),
            };
        }
        
        // 7.2. Quote Negotiation/Checking (Highest Priority after Exit)
        if (lastPlacedOrder) { 
            // Check for 'check quote status' quick reply
            if (normalizedInput === 'check quote status') {
                if (!lastPlacedOrder.order_id) return invalidInput();
                return await handleQuoteChecking(lastPlacedOrder.order_id);
            }
            // Delegate all other input to the negotiation handler
            return await handleNegotiation(ctx, input);
        }

        // 7.3. Dynamic Order Placement Phase
        if (dynamicMode) {
            if (normalizedInput === 'back') {
                return await handleBackNavigation(ctx);
            } else if (currentPhase === 'confirmation' && normalizedInput === 'confirm order') {
                return await createOrderFromCompilation(ctx);
            }

            let children: any[] = [];
            if (currentPhase === 'products') {
                children = (await getServiceDetails(currentServiceId)).children;
            } else {
                children = await getTopLevelServices(currentPhase as 'specifications' | 'sizes' | 'quantities');
            }
            return await handlePhaseSelection(ctx, input, children);
        }

        // 7.4. Order Tracking Phase
        if (trackingMode) {
            return await handleTrackOrder(ctx, input);
        }

        // 7.5. Static Navigation & Initial Transition
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

        // 7.6. Invalid Input Fallback
        return invalidInput();
    },
};