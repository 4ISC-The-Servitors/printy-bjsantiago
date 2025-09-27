import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { getCurrentCustomerId } from '../../../lib/utils';
import { supabase } from '../../../lib/supabase';

type FlowState =
  | 'start'
  | 'awaiting_order_id'
  | 'evaluating'
  | 'awaiting_auto_confirm'
  | 'awaiting_think_confirm'
  | 'awaiting_reason'
  | 'end';

let state: FlowState = 'start';
let cachedQuickReplies: string[] = [];
let currentOrderId: string | null = null;
let currentOrderStatusPrefill: string | null = null;

function startMessages(): BotMessage[] {
  return [
    {
      role: 'printy',
      text: "Hi! I'm Printy. I see you would like to cancel your order. Let me check its status first.",
    },
  ];
}

function cannotCancelMessages(reason: string): BotMessage[] {
  return [
    { role: 'printy', text: 'Sorry, this order cannot be cancelled.' },
    { role: 'printy', text: `Reason: ${reason}` },
  ];
}

async function fetchOrderForCustomer(orderId: string, customerId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', orderId)
    .eq('customer_id', customerId)
    .maybeSingle();
  if (error) return { data: null, error };
  return { data, error: null };
}

function normalizeStatus(status: unknown): string {
  return (typeof status === 'string' ? status : '').trim();
}

function isAutoCancelable(status: string): boolean {
  const s = status.toLowerCase();
  return s === 'needs quote' || s === 'awaiting quote approval';
}

function isEverCancelable(status: string): {
  cancellable: boolean;
  reason?: string;
} {
  const s = status.toLowerCase();
  if (s === 'completed')
    return { cancellable: false, reason: 'Order is already completed.' };
  if (s === 'cancelled')
    return { cancellable: false, reason: 'Order is already cancelled.' };
  if (s === 'for delivery/pick-up' || s === 'for delivery' || s === 'pick-up')
    return {
      cancellable: false,
      reason: 'Order is already scheduled for delivery/pick-up.',
    };
  return { cancellable: true };
}

async function autoCancel(orderId: string) {
  const { error } = await supabase
    .from('orders')
    .update({
      order_status: 'Cancelled',
      completed_datetime: new Date().toISOString(),
    })
    .eq('order_id', orderId);
  return { success: !error, error };
}

async function requestAdminCancellation(orderId: string, _reason: string) {
  // Persist reason later when backend field/table is available
  const { error } = await supabase
    .from('orders')
    .update({ order_status: 'Requesting Cancellation' })
    .eq('order_id', orderId);
  return { success: !error, error };
}

export const cancelOrderFlow: ChatFlow = {
  id: 'cancel-order',
  title: 'Cancel an Order',
  initial: (ctx: any) => {
    state = 'start';
    currentOrderId = null;
    currentOrderStatusPrefill = null;
    // If orderId provided in ctx, immediately ask/evaluate that order without prompting for ID
    if (
      ctx &&
      typeof ctx.orderId === 'string' &&
      ctx.orderId.trim().length > 0
    ) {
      currentOrderId = ctx.orderId.trim();
      if (typeof ctx.orderStatus === 'string')
        currentOrderStatusPrefill = ctx.orderStatus;
      // If we already know the status, branch immediately without waiting for user input
      if (currentOrderStatusPrefill) {
        const status = normalizeStatus(currentOrderStatusPrefill);
        const ever = isEverCancelable(status);
        if (!ever.cancellable) {
          state = 'end';
          cachedQuickReplies = ['End Chat'];
          return [
            {
              role: 'printy',
              text: "Hi! I'm Printy. I see you would like to cancel your order. Let me check its status first.",
            },
            ...cannotCancelMessages(ever.reason || 'Not eligible.'),
          ];
        }
        if (isAutoCancelable(status)) {
          state = 'awaiting_auto_confirm';
          cachedQuickReplies = [
            'Yes, cancel',
            'No, let me think about it',
            'End Chat',
          ];
          return [
            {
              role: 'printy',
              text: "Hi! I'm Printy. I see you would like to cancel your order. Let me check its status first.",
            },
            {
              role: 'printy',
              text: `I see that the current order status is ${status}.`,
            },
            {
              role: 'printy',
              text: 'Are you sure you want to cancel your order now? This action is irreversible once you confirm.',
            },
          ];
        }
        state = 'awaiting_reason';
        cachedQuickReplies = ['End Chat'];
        return [
          {
            role: 'printy',
            text: "Hi! I'm Printy. I see you would like to cancel your order. Let me check its status first.",
          },
          {
            role: 'printy',
            text: `I see that the current order status is ${status}.`,
          },
          {
            role: 'printy',
            text: 'Before we proceed in cancelling your order, may I ask the reason for cancellation?',
          },
        ];
      }
      cachedQuickReplies = ['End Chat'];
      return [
        {
          role: 'printy',
          text: "Hi! I'm Printy. I see you would like to cancel your order. Let me check its status first.",
        },
      ];
    }
    cachedQuickReplies = ['Cancel Order', 'End Chat'];
    return startMessages();
  },
  quickReplies: () => cachedQuickReplies,
  respond: async (ctx, input) => {
    const normalized = input.trim().toLowerCase();

    // Global End Chat
    if (normalized === 'end chat') {
      state = 'end';
      cachedQuickReplies = [];
      return {
        messages: [
          {
            role: 'printy',
            text: 'Thank you for chatting with Printy! Have a great day. 👋',
          },
        ],
        quickReplies: [],
      };
    }

    // If initial ctx included orderId and we haven't evaluated yet, run evaluation now
    if (state === 'start' && currentOrderId) {
      // Force path as if user provided order id
      state = 'awaiting_order_id';
      // Fall through to the same logic by reusing below branch
    }

    if (state === 'start') {
      if (normalized === 'cancel order') {
        state = 'awaiting_order_id';
        cachedQuickReplies = ['End Chat'];
        return {
          messages: askForOrderIdMessages(),
          quickReplies: cachedQuickReplies,
        };
      }
      return invalidInput();
    }

    if (state === 'awaiting_order_id') {
      const providedOrderId = currentOrderId || input.trim();
      const sessionCustomerId =
        typeof ctx.customerId === 'string' && ctx.customerId.length === 36
          ? (ctx.customerId as string)
          : getCurrentCustomerId();

      if (
        !sessionCustomerId ||
        typeof sessionCustomerId !== 'string' ||
        sessionCustomerId.length !== 36
      ) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'You need to sign in to cancel an order. Please sign in and try again.',
            },
          ],
          quickReplies: ['End Chat'],
        };
      }

      let order: any = null;
      if (currentOrderStatusPrefill) {
        order = { order_status: currentOrderStatusPrefill };
      }
      let error: any = null;
      if (!order) {
        const res = await fetchOrderForCustomer(
          providedOrderId,
          sessionCustomerId
        );
        order = res.data;
        error = res.error;
      }
      if (error) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'Sorry, I could not look up that order right now.',
            },
          ],
          quickReplies: ['End Chat'],
        };
      }
      if (!order) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'I could not find an order with that ID under your account.',
            },
            {
              role: 'printy',
              text: 'Please re-enter your Order ID (e.g., ORD-12345).',
            },
          ],
          quickReplies: ['End Chat'],
        };
      }

      currentOrderId = providedOrderId;
      state = 'evaluating';

      const status = normalizeStatus((order as any).order_status);
      const ever = isEverCancelable(status);
      if (!ever.cancellable) {
        state = 'end';
        cachedQuickReplies = ['End Chat'];
        return {
          messages: cannotCancelMessages(ever.reason || 'Not eligible.'),
          quickReplies: ['End Chat'],
        };
      }

      if (isAutoCancelable(status)) {
        // Show confirmation before auto-cancelling
        state = 'awaiting_auto_confirm';
        cachedQuickReplies = [
          'Yes, cancel',
          'No, let me think about it',
          'End chat',
        ];
        return {
          messages: [
            {
              role: 'printy',
              text: `I see that the current order status is ${status}.`,
            },
            {
              role: 'printy',
              text: 'Are you sure you want to cancel your order now? This action is irreversible once you confirm.',
            },
          ],
          quickReplies: cachedQuickReplies,
        };
      }

      // Ask for reason for admin approval
      state = 'awaiting_reason';
      cachedQuickReplies = ['End Chat'];
      return {
        messages: [
          {
            role: 'printy',
            text: `I see that the current order status is ${status}.`,
          },
          {
            role: 'printy',
            text: 'Before we proceed in cancelling your order, may I ask the reason for cancellation?',
          },
        ],
        quickReplies: cachedQuickReplies,
      };
    }

    if (state === 'awaiting_auto_confirm') {
      if (normalized === 'yes, cancel' || normalized === 'yes') {
        if (!currentOrderId) return invalidSession();
        const result = await autoCancel(currentOrderId);
        state = 'end';
        cachedQuickReplies = ['End chat'];
        if (!result.success) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'I was unable to cancel your order automatically.',
              },
              {
                role: 'printy',
                text: 'Please try again later or contact support.',
              },
            ],
            quickReplies: ['End chat'],
          };
        }
        return {
          messages: [
            {
              role: 'printy',
              text: 'Okay, let me quickly process that for you.',
            },
            {
              role: 'printy',
              text: 'Order cancellation successful! Your order will no longer be processed.',
            },
          ],
          quickReplies: ['End chat'],
        };
      }
      if (normalized === 'no, let me think about it' || normalized === 'no') {
        state = 'awaiting_think_confirm';
        cachedQuickReplies = ['Proceed to cancelling', 'End Chat'];
        return {
          messages: [
            {
              role: 'printy',
              text: 'Great! Better to check everything first before cancelling.',
            },
          ],
          quickReplies: cachedQuickReplies,
        };
      }
      return invalidInput();
    }

    if (state === 'awaiting_think_confirm') {
      if (normalized === 'proceed to cancelling' || normalized === 'proceed') {
        state = 'awaiting_auto_confirm';
        cachedQuickReplies = ['Yes, cancel', 'End chat'];
        return {
          messages: [
            {
              role: 'printy',
              text: 'Are you sure you want to cancel your order now? This action is irreversible once you confirm.',
            },
          ],
          quickReplies: cachedQuickReplies,
        };
      }
      if (normalized === 'end chat' || normalized === 'end') {
        state = 'end';
        cachedQuickReplies = [];
        return {
          messages: [
            {
              role: 'printy',
              text: 'Thank you for chatting with Printy! Have a great day. 👋',
            },
          ],
          quickReplies: [],
        };
      }
      return invalidInput();
    }

    if (state === 'awaiting_reason') {
      const reason = input.trim();
      if (!currentOrderId) {
        return invalidSession();
      }

      const result = await requestAdminCancellation(currentOrderId, reason);
      state = 'end';
      cachedQuickReplies = ['End Chat'];
      if (!result.success) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'Sorry, I could not submit your cancellation request.',
            },
            { role: 'printy', text: 'Please try again later.' },
          ],
          quickReplies: ['End Chat'],
        };
      }

      return {
        messages: [
          {
            role: 'printy',
            text: 'Okay, I see. I changed the status of your order to "Requesting Cancellation".',
          },
          {
            role: 'printy',
            text: 'Our admin will verify your reason first before your order is completely cancelled.',
          },
        ],
        quickReplies: ['End Chat'],
      };
    }

    // Fallback
    return invalidInput();
  },
};

function askForOrderIdMessages(): BotMessage[] {
  return [
    { role: 'printy', text: 'Sure — I can help cancel an order.' },
    { role: 'printy', text: 'Please enter your Order ID (e.g., ORD-12345).' },
  ];
}

function invalidInput(): { messages: BotMessage[]; quickReplies: string[] } {
  return {
    messages: [
      {
        role: 'printy',
        text: "Sorry, I don't understand. I'm a prompt-based chatbot, not AI, unfortunately. I can only understand context from certain quick replies.",
      },
    ],
    quickReplies:
      cachedQuickReplies && cachedQuickReplies.length > 0
        ? cachedQuickReplies
        : ['End Chat'],
  };
}

function invalidSession(): { messages: BotMessage[]; quickReplies: string[] } {
  state = 'end';
  return {
    messages: [
      {
        role: 'printy',
        text: 'Session expired. Please restart the cancellation process.',
      },
    ],
    quickReplies: ['End Chat'],
  };
}
