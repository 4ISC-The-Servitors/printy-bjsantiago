// OrderTracking.ts

import { supabase } from '../../../lib/supabase';
import { getCurrentCustomerId } from '../../../lib/utils';
import type { OrderData } from '../../../api/orderApi';
import type { BotMessage } from '../../../types/chatFlow';
import type { Node } from './PlaceOrder';
import {
    NODES,
    setFlowState,
    resetOrderRecord,
    loadPhaseOptions,
    currentNodeId,
    setFlowState as setPlaceOrderFlowState,
} from './PlaceOrder';


// --- 1. LOCAL STATE MANAGEMENT (Shared Quote State) ---

// State to hold the details of the last placed order for quote checking/negotiation
type LastOrderState = (OrderData & {
    order_id: string; // Ensure Order ID is always mandatory here
    product_service_name?: string;
    remarks?: string;
    proposed_price?: number;
    // --- FIX: Added the missing printing_services property to resolve TS error ---
    printing_services?: {
        service_name: string;
    } | null;
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
        // 'Submit Modified Quotation' is only available after changes
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
    // When tracking generally, we must ensure we get the latest quote if multiple are returned.
    // We assume 'quote_issue_datetime' is the correct sorting column.
    const latestQuote = order.quotes && order.quotes.length > 0
        ? order.quotes.sort((a: any, b: any) => new Date(b.quote_issue_datetime).getTime() - new Date(a.quote_issue_datetime).getTime())[0]
        : null;

    const quotedPrice = latestQuote ? (latestQuote.negotiated_price || latestQuote.initial_price) : null;
    const orderDate = order.order_datetime || order.order_date_time;

    // Access the product name from the joined object
    const productName = order.printing_services?.service_name || order.product_service_name || 'N/A';

    // Formatted with clean arrangement/all caps labels
    let statusText = `ORDER ID: ${order.order_id}\nSTATUS: ${order.order_status}\nPRODUCT: ${productName}\nDATE: ${new Date(orderDate).toLocaleDateString()}`;

    if (quotedPrice) {
        statusText += `\nQUOTED PRICE: P${quotedPrice.toFixed(2)}`;
    }

    // Quick replies are now the standard post-tracking options
    return { statusText, cachedQuickReplies: ['Place Order', 'End Chat'] };
}


// --- 3. QUOTE NEGOTIATION LOGIC ---

/**
 * Executes the RPC to get the order and ONLY the latest quote, then displays the negotiation options.
 * This replaces the complex and brittle PostgREST nested query.
 */
export async function displayQuoteDetails(orderId: string): Promise<any> {

    // --- RPC INTEGRATION: Call the stable PostgreSQL function ---
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_latest_quote_for_order', {
        target_order_id: orderId,
    });

    // The RPC returns a single JSON object.
    const result = rpcResult as any;

    if (rpcError || !result || !result.order) {
        console.error("RPC Error or No Data returned from get_latest_quote_for_order:", rpcError || 'No data');
        // Fallback to initial check if the RPC fails
        return await handleQuoteChecking(orderId);
    }

    // 1. Reconstruct the 'order' object from the RPC response.
    // The RPC returns { order: {...}, latest_quote: {...} }
    const order = {
        ...result.order,
        // The RPC does not include the joined 'printing_services', so we rely on state or previous lookup
        printing_services: lastPlacedOrder?.printing_services || null,
        // 'quotes' is an array containing only the latest quote for negotiation display.
        quotes: result.latest_quote ? [result.latest_quote] : [],
    } as any;

    // Use the latest quote (which is guaranteed to be at index 0 or null if no quotes)
    const quote = order.quotes[0];
    const quotedPrice = quote.negotiated_price || quote.initial_price;

    // Access the product name from the joined object
    const productName = order.printing_services?.service_name || lastPlacedOrder?.product_service_name || 'N/A';


    const messages: BotMessage[] = [
        // All caps header
        { role: 'printy', text: `QUOTE REVIEW FOR ORDER ID: ${orderId}` },
        {
            role: 'printy',
            text: `PRODUCT: ${productName}\nDETAILS: ${order.specification}, ${order.page_size}, ${order.quantity}\nQUOTE PRICE: ${quotedPrice ? `P${quotedPrice.toFixed(2)}` : 'Awaiting Quote'}\nREMARKS: ${lastPlacedOrder?.remarks || 'None'}`,
        }
    ];

    if (quoteModified) {
        if (lastPlacedOrder?.proposed_price) {
            messages.push({ role: 'printy', text: `PROPOSED PRICE: P${lastPlacedOrder.proposed_price.toFixed(2)}`});
        }
    }

    setFlowState('quote_negotiation');
    const quickReplies = getNegotiationOptions(quoteModified);

    return {
        messages: messages.concat(nodeToMessages(NODES.quote_negotiation)),
        quickReplies: quickReplies,
    };
}


/**
 * Core logic for checking if a quote is ready. Uses a robust, simple SELECT.
 */
export async function handleQuoteChecking(orderId: string): Promise<any> {

    // --- FIX: Use a SIMPLIFIED select for the initial order existence check ---
    const { data: simpleOrderResult, error } = await supabase
        .from('orders')
        .select(`*, quotes(initial_price, negotiated_price, quote_issue_datetime, quote_due_datetime), printing_services(service_name)`)
        .eq('order_id', orderId)
        .maybeSingle();

    const order = simpleOrderResult as any;

    if (error) {
        console.error("Supabase error retrieving simple order data:", error);
    }

    if (error || !order) {
        setFlowState('end');
        return {
            messages: [{ role: 'printy', text: 'Error retrieving order details. Please try again or contact support.' }],
            quickReplies: nodeQuickReplies(NODES.end),
        };
    }

    // The presence of a quote means it's ready for approval
    const orderHasQuote = order.quotes && order.quotes.length > 0;

    if (orderHasQuote) {
        // Quote is ready: transition to negotiation display

        setLastPlacedOrder({
            ...(order as any),
            order_id: orderId,
            remarks: order.remarks || '',
            proposed_price: order.proposed_price || null,
            // Set the product name from the joined table data
            product_service_name: order.printing_services?.service_name || (order as any).product_service_name,
            printing_services: order.printing_services || null // Cache the joined data
        });
        setQuoteModified(order.proposed_price || order.remarks ? true : false);

        // Pass to displayQuoteDetails, which now uses the stable RPC.
        return await displayQuoteDetails(orderId);
    }

    // Quote is NOT ready: prompt user to wait
    setFlowState('quote_not_ready');
    const quickReplies = nodeQuickReplies(NODES.quote_not_ready);

    NODES.quote_not_ready.message = `The quote for order **${orderId}** is still being processed. Please check back later, or allow up to 2 business days from submission.`;

    setLastPlacedOrder({
        order_id: orderId,
    } as LastOrderState);

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
                    messages: [{ role: 'printy', text: 'You have modified the quote. Please select "Submit Modified Quotation" or undo your changes.' }],
                    quickReplies: getNegotiationOptions(quoteModified),
                };
            }

            // Requires RLS UPDATE permission
            const { error: updateError } = await supabase.from('orders').update({ order_status: 'Awaiting Payment' }).eq('order_id', currentOrder.order_id);

            if (updateError) {
                console.error("Error confirming order:", updateError);
                return {
                    messages: [{ role: 'printy', text: 'Error processing your confirmation. Please try again.' }],
                    quickReplies: getNegotiationOptions(quoteModified),
                };
            }

            setLastPlacedOrder(null);
            setFlowState('confirm_quote');

            return { messages: nodeToMessages(NODES.confirm_quote), quickReplies: nodeQuickReplies(NODES.confirm_quote) };

        case 'submit modified quotation':
            if (!quoteModified) {
                return {
                    messages: [{ role: 'printy', text: 'The quote has not been modified. Please select "Accept and Confirm Order".' }],
                    quickReplies: getNegotiationOptions(quoteModified),
                };
            }

            // Requires RLS UPDATE permission
            await supabase.from('orders').update({
                order_status: 'Needs Quote', // Loop Back
                remarks: currentOrder.remarks,
                proposed_price: currentOrder.proposed_price,
            }).eq('order_id', currentOrder.order_id);

            setQuoteModified(false);
            const submittedOrderId = currentOrder.order_id;

            setLastPlacedOrder({
                order_id: submittedOrderId,
            } as LastOrderState);

            setFlowState('quote_not_ready');

            NODES.quote_not_ready.message = `Modified quote for order **${submittedOrderId}** submitted successfully. The team will review your changes and issue a new quote shortly. You can check back later, or allow up to 2 business days from submission.`;

            return {
                messages: nodeToMessages(NODES.quote_not_ready),
                quickReplies: nodeQuickReplies(NODES.quote_not_ready)
            };

        case 'back to negotiation':
            return await displayQuoteDetails(currentOrder.order_id);

        default:
            return invalidInput();
    }
}


// --- 4. ORDER TRACKING LOGIC ---

/**
 * Handles the input for order tracking, including the special case for 'Check Quote Status'
 */
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

    // === Handle 'Check Quote Status' ===
    if (normalizedInput === 'check quote status' && currentNodeId === 'quote_not_ready' && lastPlacedOrder?.order_id) {
        const orderIdToCheck = lastPlacedOrder.order_id;
        setFlowState('track_order_options', false);
        return await handleQuoteChecking(orderIdToCheck);
    }
    // ===============================================

    let trackingResponse: any = null;

    if (normalizedInput === 'back') {
        if (['track_by_id', 'track_by_id_result', 'track_latest_order', 'track_all_orders'].includes(currentNodeId)) {
            setFlowState('track_order_options');
        } else if (currentNodeId === 'track_order_options') {
            setPlaceOrderFlowState('place_order_start', false);
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
                quickReplies: ['Place Order', 'End Chat'], // Standard final options
            };
            break;
        default:
            if (currentNodeId === 'track_by_id') {
                // FIX: Strip the 'ORD-' prefix if it exists before query
                const rawId = input.trim();
                const cleanId = rawId.toUpperCase().startsWith('ORD-') ? rawId.substring(4) : rawId;
                trackingResponse = await getOrderByID(cleanId, customerId);
            } else {
                trackingResponse = invalidInput();
            }
            break;
    }

    return trackingResponse;
}

async function getLatestOrder(customerId: string): Promise<any> {
    const { data: orderResult, error } = await supabase
        .from('orders')
        .select(`*, quotes(initial_price, negotiated_price, quote_issue_datetime, quote_due_datetime), printing_services(service_name)`)
        .eq('customer_id', customerId)
        .order('order_datetime', { ascending: false })
        .limit(1)
        .maybeSingle();

    const order = orderResult as any;

    if (error || !order) {
        setFlowState('track_latest_order');
        return {
            messages: [{ role: 'printy', text: 'Could not find your latest order or an error occurred.' }],
            quickReplies: ['Place Order', 'End Chat'],
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
    const { data: ordersResult, error } = await supabase
        .from('orders')
        .select(`*, quotes(initial_price, negotiated_price, quote_issue_datetime, quote_due_datetime), printing_services(service_name)`)
        .eq('customer_id', customerId)
        .order('order_datetime', { ascending: false });

    const orders = ordersResult as any[];

    if (error || !orders || orders.length === 0) {
        setFlowState('track_all_orders');
        return {
            messages: [{ role: 'printy', text: 'You have no orders or an error occurred.' }],
            quickReplies: ['Place Order', 'End Chat'],
        };
    }

    // FIX: Handle asynchronous calls inside map using Promise.all
    const statusPromises = orders.map(order => getDisplayStatus(order));
    const allStatusDetails = await Promise.all(statusPromises);

    const messages = allStatusDetails.map((statusDetails, index) => {
        const order = orders[index];
        const orderDate = order.order_datetime || order.order_date_time;

        return {
            role: 'printy',
            // Use only the first line of statusText for the condensed list view
            text: statusDetails.statusText.split('\n')[0].replace(`ORDER ID: ${order.order_id}`, `${index + 1}. ORDER ID: ${order.order_id}`) +
                  ` | STATUS: ${order.order_status} | DATE: ${new Date(orderDate).toLocaleDateString()}`,
        };
    });

    setFlowState('track_all_orders');
    return {
        messages: [{ role: 'printy', text: `FOUND ${orders.length} ORDERS:` }, ...messages, { role: 'printy', text: 'What would you like to do next?' }],
        quickReplies: ['Place Order', 'End Chat'],
    };
}

async function getOrderByID(orderId: string, customerId: string): Promise<any> {
    const { data: orderResult, error } = await supabase
        .from('orders')
        .select(`*, quotes(initial_price, negotiated_price, quote_issue_datetime, quote_due_datetime), printing_services(service_name)`)
        // The orderId passed here is already cleaned of the 'ORD-' prefix
        .eq('order_id', orderId)
        .eq('customer_id', customerId)
        .maybeSingle();

    const order = orderResult as any;

    if (error || !order) {
        setFlowState('track_by_id');
        return {
            messages: [{ role: 'printy', text: `Could not find order ${orderId} under your account. Please re-enter the ID or choose an option.` }],
            quickReplies: ['Track Order', 'Place Order', 'End Chat'],
        };
    }

    setFlowState('track_by_id_result');
    const { statusText, cachedQuickReplies } = await getDisplayStatus(order);

    return {
        messages: [{ role: 'printy', text: statusText }],
        quickReplies: cachedQuickReplies,
    };
}