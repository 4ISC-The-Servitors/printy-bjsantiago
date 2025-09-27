// OrderTracking.ts

import { supabase } from '../../../lib/supabase';
import { getCurrentCustomerId } from '../../../lib/utils';
// FIX: Imported Node as a type and explicitly imported other types
import type { OrderData } from '../../../api/orderApi';
import type { BotMessage } from '../../../types/chatFlow';
import type { Node } from './PlaceOrder'; 
import { 
    NODES, 
    setFlowState,
    resetOrderRecord,
    loadPhaseOptions,
    currentNodeId,
    setFlowState as setPlaceOrderFlowState 
} from './PlaceOrder'; 


// --- 1. LOCAL STATE MANAGEMENT (Shared Quote State) ---

// State to hold the details of the last placed order for quote checking/negotiation
type LastOrderState = (OrderData & {
    product_service_name?: string;
    remarks?: string;
    proposed_price?: number;
}) | null;

export let lastPlacedOrder: LastOrderState = null;
export let quoteModified: boolean = false;

export const setLastPlacedOrder = (order: LastOrderState) => {
    lastPlacedOrder = order;
};

export const setQuoteModified = (modified: boolean) => {
    quoteModified = modified;
};


// --- 2. UTILITY FUNCTIONS ---

function nodeToMessages(node: Node): BotMessage[] {
    if (node.message) return [{ role: 'printy', text: node.message }];
    if (node.answer) return [{ role: 'printy', text: node.answer }];
    return [];
}

function nodeQuickReplies(node: Node): string[] {
    return node.options.map(o => o.label);
}

function getNegotiationOptions(modified: boolean): string[] {
    const baseOptions = ['Accept and Confirm Order', 'Propose Alternative Price', 'Add/Edit Remarks', 'Edit Product Details', 'End Chat'];

    if (modified) {
        return ['Submit Modified Quotation', ...baseOptions];
    }

    return baseOptions;
}

function invalidInput(): { messages: BotMessage[]; quickReplies: string[] } {
    return {
        messages: [
            {
                role: 'printy',
                text: "Sorry, I don't understand. Please choose from the options.",
            },
        ],
        // Use negotiation/tracking options if available, otherwise default
        quickReplies: lastPlacedOrder 
            ? getNegotiationOptions(quoteModified) 
            : nodeQuickReplies(NODES[currentNodeId]),
    };
}

function invalidSession(): { messages: BotMessage[]; quickReplies: string[] } {
    setFlowState('end');
    return {
        messages: [
            {
                role: 'printy',
                text: 'Error: Session expired or data missing. Please restart the process.',
            },
        ],
        quickReplies: ['End Chat'],
    };
}

async function getDisplayStatus(order: any): Promise<{ statusText: string, cachedQuickReplies: string[] }> {
    const quote = order.quotes && order.quotes.length > 0 ? order.quotes[0] : null;
    const quotedPrice = quote ? (quote.negotiated_price || quote.initial_price) : null;
    const orderDate = order.order_datetime || order.order_date_time; 
    
    let statusText = `Order ID: **${order.order_id}**\nStatus: **${order.order_status}**\nProduct: ${order.product_service_name || 'N/A'}\nDate: ${new Date(orderDate).toLocaleDateString()}`;

    if (quotedPrice) {
        statusText += `\nQuoted Price: ₱${quotedPrice.toFixed(2)}`;
    }

    return { statusText, cachedQuickReplies: ['End Chat'] };
}


// --- 3. QUOTE NEGOTIATION LOGIC ---

// Function to display the quote details and negotiation options
export async function displayQuoteDetails(orderId: string): Promise<any> {
    const { data: order, error } = await supabase
        .from('orders')
        .select(`*, quotes:quotes(initial_price, negotiated_price, quote_issue_datetime, quote_due_datetime)`)
        .eq('order_id', orderId)
        .maybeSingle();

    if (error || !order || !order.quotes || order.quotes.length === 0) {
        return await handleQuoteChecking(orderId); // Should not happen if called correctly, but fallback
    }

    const quote = order.quotes[0];
    const quotedPrice = quote.negotiated_price || quote.initial_price;

    const messages: BotMessage[] = [
        { role: 'printy', text: `Order ID: ${orderId}` },
        {
            role: 'printy',
            text: `**Product:** ${order.product_service_name || 'N/A'}\n**Details:** ${order.specification}, ${order.page_size}, ${order.quantity}\n**Quote Price:** ${quotedPrice ? `₱${quotedPrice.toFixed(2)}` : 'Awaiting Quote'}\n**Remarks:** ${lastPlacedOrder?.remarks || 'None'}`,
        }
    ];

    if (quoteModified) {
        if (lastPlacedOrder?.proposed_price) {
            messages.push({ role: 'printy', text: `- **Proposed Price:** ₱${lastPlacedOrder.proposed_price.toFixed(2)}`});
        }
    }

    setFlowState('quote_negotiation');
    const quickReplies = getNegotiationOptions(quoteModified);

    return {
        messages: messages.concat(nodeToMessages(NODES.quote_negotiation)),
        quickReplies: quickReplies,
    };
}


// Core logic for checking if a quote is ready
export async function handleQuoteChecking(orderId: string): Promise<any> {
    const { data: order, error } = await supabase
        .from('orders')
        .select(`*, quotes:quotes(initial_price, negotiated_price, quote_issue_datetime, quote_due_datetime)`)
        .eq('order_id', orderId)
        .maybeSingle();

    if (error || !order) {
        setFlowState('end');
        return {
            messages: [{ role: 'printy', text: 'Error retrieving order details. Please try again or contact support.' }],
            quickReplies: nodeQuickReplies(NODES.end),
        };
    }

    if (order.quotes && order.quotes.length > 0) {
        // Quote is ready: transition to negotiation display
        setLastPlacedOrder({
            ...(order as any),
            order_id: orderId,
            remarks: order.remarks || '',
            proposed_price: order.proposed_price || null,
        });
        setQuoteModified(order.proposed_price || order.remarks ? true : false);
        return await displayQuoteDetails(orderId); 
    }

    // Quote is NOT ready: prompt user to wait
    setFlowState('quote_not_ready');
    const quickReplies = nodeQuickReplies(NODES.quote_not_ready);
    
    // Dynamically set the message for the specific order
    NODES.quote_not_ready.message = `The quote for order **${orderId}** is still being processed. Please check back later, or allow up to **2 business days** from submission.`;

    return {
        messages: nodeToMessages(NODES.quote_not_ready),
        quickReplies: quickReplies,
    };
}


// Core logic for handling negotiation input
export async function handleNegotiation(ctx: any, input: string): Promise<any> {
    const normalized = input.trim().toLowerCase();

    if (!lastPlacedOrder || !lastPlacedOrder.order_id) return invalidSession();

    const currentOrder = lastPlacedOrder; 

    // Handle input when waiting for price or remarks
    if (currentNodeId === 'negotiate_price_input') {
        const price = parseFloat(input.trim());
        if (isNaN(price) || price <= 0) {
            return {
                messages: [{ role: 'printy', text: 'Please enter a valid positive number for the price.' }],
                quickReplies: nodeQuickReplies(NODES.negotiate_price_input),
            };
        }
        currentOrder.proposed_price = price; 
        setQuoteModified(true);
        return await displayQuoteDetails(currentOrder.order_id);
    }

    if (currentNodeId === 'add_remarks_input') {
        currentOrder.remarks = input.trim(); 
        setQuoteModified(true);
        return await displayQuoteDetails(currentOrder.order_id);
    }

    // Handle quick reply options
    switch (normalized) {
        case 'propose alternative price':
            setFlowState('negotiate_price_input');
            return { messages: nodeToMessages(NODES.negotiate_price_input), quickReplies: nodeQuickReplies(NODES.negotiate_price_input) };

        case 'add/edit remarks':
            setFlowState('add_remarks_input');
            return { messages: nodeToMessages(NODES.add_remarks_input), quickReplies: nodeQuickReplies(NODES.add_remarks_input) };

        case 'edit product details': 
            // Reset quote state, transition back to the main flow's 'products' phase
            setLastPlacedOrder(null);
            setQuoteModified(false);
            resetOrderRecord(); 
            setFlowState('place_order', true, 'products', null, []); 
            return await loadPhaseOptions(ctx);

        case 'accept and confirm order':
            if (quoteModified) {
                return {
                    messages: [{ role: 'printy', text: 'You have modified the quote. Please select **"Submit Modified Quotation"** or undo your changes.' }],
                    quickReplies: getNegotiationOptions(quoteModified), 
                };
            }
            await supabase.from('orders').update({ order_status: 'Awaiting Payment' }).eq('order_id', currentOrder.order_id); 
            setLastPlacedOrder(null); 
            setFlowState('confirm_quote');
            return { messages: nodeToMessages(NODES.confirm_quote), quickReplies: nodeQuickReplies(NODES.confirm_quote) };

        case 'submit modified quotation':
            if (!quoteModified) {
                return {
                    messages: [{ role: 'printy', text: 'The quote has not been modified. Please select **"Accept and Confirm Order"**.' }],
                    quickReplies: getNegotiationOptions(quoteModified), 
                };
            }
            await supabase.from('orders').update({ 
                order_status: 'Needs Quote', 
                remarks: currentOrder.remarks,
                proposed_price: currentOrder.proposed_price, 
            }).eq('order_id', currentOrder.order_id);

            setQuoteModified(false); 
            setLastPlacedOrder(null);
            setFlowState('modified_quote_submitted'); 
            return { messages: nodeToMessages(NODES.modified_quote_submitted), quickReplies: nodeQuickReplies(NODES.modified_quote_submitted) };
        
        case 'back to negotiation':
            return await displayQuoteDetails(currentOrder.order_id); 

        default:
            return invalidInput();
    }
}


// --- 4. ORDER TRACKING LOGIC ---

async function getLatestOrder(customerId: string): Promise<any> {
    const { data: order, error } = await supabase
        .from('orders')
        .select(`*, quotes:quotes(initial_price, negotiated_price, quote_issue_datetime, quote_due_datetime)`)
        .eq('customer_id', customerId)
        .order('order_datetime', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !order) {
        setFlowState('track_latest_order');
        return {
            messages: [{ role: 'printy', text: 'Could not find your latest order or an error occurred.' }],
            quickReplies: ['Back', 'End Chat'],
        };
    }

    setFlowState('track_latest_order');
    const { statusText, cachedQuickReplies } = await getDisplayStatus(order);

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
        setFlowState('track_all_orders');
        return {
            messages: [{ role: 'printy', text: 'You have no orders or an error occurred.' }],
            quickReplies: ['Back', 'End Chat'],
        };
    }

    const messages = orders.map((order, index) => {
        const orderDate = order.order_datetime || order.order_date_time;
        return {
            role: 'printy',
            text: `**${index + 1}.** Order ID: **${order.order_id}** | Status: **${order.order_status}** | Date: ${new Date(orderDate).toLocaleDateString()}`,
        };
    });

    setFlowState('track_all_orders');
    return {
        messages: [{ role: 'printy', text: `Found ${orders.length} orders:` }, ...messages, { role: 'printy', text: 'What would you like to do next?' }],
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
        setFlowState('track_by_id');
        return {
            messages: [{ role: 'printy', text: `Could not find order **${orderId}** under your account.` }],
            quickReplies: ['Back', 'End Chat'],
        };
    }

    setFlowState('track_by_id_result');
    const { statusText, cachedQuickReplies } = await getDisplayStatus(order);

    return {
        messages: [{ role: 'printy', text: statusText }],
        quickReplies: cachedQuickReplies,
    };
}

export async function handleTrackOrder(_ctx: any, input: string): Promise<any> {
    const normalizedInput = input.trim().toLowerCase();
    const customerId = getCurrentCustomerId();

    if (!customerId) {
        setPlaceOrderFlowState('end', false);
        return {
            messages: [{ role: 'printy', text: 'You must be signed in to track orders.' }],
            quickReplies: nodeQuickReplies(NODES.end),
        };
    }

    let trackingResponse: any = null;

    if (normalizedInput === 'back') {
        if (currentNodeId === 'track_by_id' || currentNodeId === 'track_by_id_result') {
            setFlowState('track_order_options');
        } else if (currentNodeId === 'track_order_options') {
            setPlaceOrderFlowState('place_order_start', false); 
        } else {
            setFlowState('track_order_options');
        }

        return {
            messages: nodeToMessages(NODES[currentNodeId]),
            quickReplies: nodeQuickReplies(NODES[currentNodeId]),
        };
    }

    switch (normalizedInput) {
        case 'latest order':
            trackingResponse = await getLatestOrder(customerId);
            break;
        case 'all orders':
            trackingResponse = await getAllOrders(customerId);
            break;
        case 'use order id':
            setFlowState('track_by_id');
            trackingResponse = {
                messages: nodeToMessages(NODES[currentNodeId]),
                quickReplies: nodeQuickReplies(NODES[currentNodeId]),
            };
            break;
        default:
            if (currentNodeId === 'track_by_id') {
                trackingResponse = await getOrderByID(input.trim(), customerId);
            } else {
                trackingResponse = invalidInput();
            }
            break;
    }

    return trackingResponse;
}