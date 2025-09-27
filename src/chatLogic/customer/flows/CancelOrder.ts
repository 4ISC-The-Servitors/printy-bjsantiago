// CancelOrder.ts

import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
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

// Internal static nodes for the Cancel Order flow
const NODES: Record<string, Node> = {
  cancel_start: {
    id: 'cancel_start',
    message: 'To cancel an order, please provide the **Order ID** you wish to cancel.',
    options: [{ label: 'Back to Main Menu', next: 'end_flow_return' }, { label: 'End Chat', next: 'end' }],
  },
  cancel_confirm: {
    id: 'cancel_confirm',
    message: '', // Dynamically set message: "Are you sure you want to cancel order [ID]?"
    options: [
      { label: 'Yes, Cancel It', next: 'cancel_processing' },
      { label: 'No, Keep It', next: 'end_flow_return' },
    ],
  },
  cancel_processing: {
    id: 'cancel_processing',
    message: 'Processing cancellation...', // Message will be set dynamically (Success/Fail)
    options: [{ label: 'End Chat', next: 'end' }],
  },
  cancel_error: {
    id: 'cancel_error',
    message: 'Sorry, I could not find an order with that ID or you are not authorized to cancel it.',
    options: [{ label: 'Try Another ID', next: 'cancel_start' }, { label: 'End Chat', next: 'end' }],
  },
  end_flow_return: {
    id: 'end_flow_return',
    answer: 'Thank you. Returning you to the Main Menu. 👋',
    options: [],
  },
  end: {
    id: 'end',
    answer: 'Thank for chatting with Printy! Have a great day. 👋',
    options: [],
  },
};

let currentNodeId: keyof typeof NODES = 'cancel_start';
let cachedQuickReplies: string[] = [];
let targetOrderId: string | null = null;
let returningToParent = false;

function nodeToMessages(node: Node): BotMessage[] {
  if (node.message) return [{ role: 'printy', text: node.message }];
  if (node.answer) return [{ role: 'printy', text: node.answer }];
  return [];
}

function nodeQuickReplies(node: Node): string[] {
  return node.options.map(o => o.label);
}

function invalidInput(): { messages: BotMessage[]; quickReplies: string[] } {
  return {
    messages: [
      {
        role: 'printy',
        text: "Sorry, I don't understand. Please choose from the options.",
      },
    ],
    quickReplies: cachedQuickReplies,
  };
}

async function processCancellation(): Promise<any> {
  const customerId = getCurrentCustomerId();
  const orderId = targetOrderId;
  
  if (!customerId || !orderId) {
    currentNodeId = 'cancel_error';
    return {
      messages: [{ role: 'printy', text: 'Cancellation failed: Missing order ID or user authentication.' }],
      quickReplies: nodeQuickReplies(NODES[currentNodeId]),
      flowSwitch: returningToParent ? 'return' : undefined,
    };
  }
  
  // 1. Fetch order to ensure it's cancelable and belongs to the customer
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('order_status')
    .eq('order_id', orderId)
    .eq('customer_id', customerId)
    .maybeSingle();
    
  if (fetchError || !order) {
    currentNodeId = 'cancel_error';
    return {
      messages: nodeToMessages(NODES[currentNodeId]),
      quickReplies: nodeQuickReplies(NODES[currentNodeId]),
      flowSwitch: returningToParent ? 'return' : undefined,
    };
  }

  const cancelableStatuses = ['Needs Quote', 'Awaiting Quote Approval', 'Quoted'];
  if (!cancelableStatuses.includes(order.order_status)) {
    currentNodeId = 'cancel_processing';
    const message = `Order **${orderId}** cannot be cancelled because its current status is **${order.order_status}**.`;
    return {
      messages: [{ role: 'printy', text: message }],
      quickReplies: nodeQuickReplies(NODES[currentNodeId]),
      flowSwitch: returningToParent ? 'return' : undefined,
    };
  }
  
  // 2. Update order status to 'Cancelled'
  const { error: updateError } = await supabase
    .from('orders')
    .update({ order_status: 'Cancelled' })
    .eq('order_id', orderId);
    
  if (updateError) {
    console.error('Cancellation Update Error:', updateError);
    currentNodeId = 'cancel_processing';
    const message = `Cancellation failed for **${orderId}** due to a database error. Please try again or contact support.`;
    return {
      messages: [{ role: 'printy', text: message }],
      quickReplies: nodeQuickReplies(NODES[currentNodeId]),
      flowSwitch: returningToParent ? 'return' : undefined,
    };
  }
  
  // 3. Success
  currentNodeId = 'cancel_processing';
  const successMessage = `✅ Order **${orderId}** has been successfully **CANCELLED**.`;
  
  // Check if we need to return to the parent flow (PlaceOrder.ts)
  const flowSwitch = returningToParent ? 'return' : undefined;

  return {
    messages: [{ role: 'printy', text: successMessage }],
    quickReplies: nodeQuickReplies(NODES[currentNodeId]),
    // Use the special 'return' flowSwitch to go back to the parent flow
    flowSwitch: flowSwitch, 
  };
}

export const cancelOrderFlow: ChatFlow = {
  id: 'cancel-order', // This MUST match the 'externalFlow' value in PlaceOrder.ts
  title: 'Cancel Order Assistant',
  initial: (ctx: any) => {
    // Reset state variables
    targetOrderId = null;
    returningToParent = false;
    
    // FIX: Check for externalContext passed from PlaceOrder.ts
    const incomingContext = ctx.externalContext;

    if (incomingContext && incomingContext.orderId) {
      targetOrderId = incomingContext.orderId;
      returningToParent = true; // Assume if context is passed, we want to return

      currentNodeId = 'cancel_confirm';
      const message = `Are you sure you want to cancel Order ID: **${targetOrderId}**? (Status: ${incomingContext.orderStatus})`;
      
      // Update the dynamic message for the confirmation node
      NODES.cancel_confirm.message = message; 
      
      cachedQuickReplies = nodeQuickReplies(NODES[currentNodeId]);
      return nodeToMessages(NODES[currentNodeId]);
    }

    // Cold start (no context) - ask for ID
    currentNodeId = 'cancel_start';
    cachedQuickReplies = nodeQuickReplies(NODES[currentNodeId]);
    return nodeToMessages(NODES[currentNodeId]);
  },
  
  quickReplies: () => cachedQuickReplies,
  
  respond: async (_ctx, input) => { // FIX 1: Renamed 'ctx' to '_ctx'
    const normalizedInput = input.trim().toLowerCase();
    
    // Global End Chat check
    if (normalizedInput === 'end chat') {
        currentNodeId = 'end';
        return {
            messages: nodeToMessages(NODES[currentNodeId]),
            quickReplies: nodeQuickReplies(NODES[currentNodeId]),
        };
    }

    // Handle flow switch to return to parent flow (PlaceOrder.ts)
    if (currentNodeId === 'end_flow_return') {
        return {
            messages: nodeToMessages(NODES[currentNodeId]),
            quickReplies: nodeQuickReplies(NODES.place_order_start), // Assuming parent flow start quick replies
            flowSwitch: 'return',
        };
    }

    // 1. Process Order ID input
    if (currentNodeId === 'cancel_start') {
      const orderId = input.trim();
      if (!orderId || orderId.length < 5) {
        return {
          messages: [{ role: 'printy', text: 'Please enter a valid looking Order ID (e.g., ORD-0001).' }],
          quickReplies: nodeQuickReplies(NODES[currentNodeId]),
        };
      }
      targetOrderId = orderId;
      currentNodeId = 'cancel_confirm';
      
      // Update dynamic message for the new ID
      NODES.cancel_confirm.message = `Are you sure you want to cancel Order ID: **${targetOrderId}**?`;
      
      cachedQuickReplies = nodeQuickReplies(NODES[currentNodeId]);
      return nodeToMessages(NODES[currentNodeId]);
    }
    
    // 2. Process Confirmation
    if (currentNodeId === 'cancel_confirm') {
      if (normalizedInput === 'yes, cancel it') {
        return await processCancellation();
      } else if (normalizedInput === 'no, keep it') {
        currentNodeId = 'end_flow_return';
        return {
             messages: nodeToMessages(NODES[currentNodeId]),
             quickReplies: nodeQuickReplies(NODES.place_order_start),
             flowSwitch: 'return', // Return to parent flow
        };
      }
    }
    
    // 3. Handle 'Try Another ID' from error state
    if (currentNodeId === 'cancel_error' && normalizedInput === 'try another id') {
        targetOrderId = null;
        currentNodeId = 'cancel_start';
        cachedQuickReplies = nodeQuickReplies(NODES[currentNodeId]);
        return nodeToMessages(NODES[currentNodeId]);
    }

    // Default: Invalid input for the current state
    return invalidInput();
  },
};