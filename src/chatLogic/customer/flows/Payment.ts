import type { BotMessage, ChatFlow } from '../../../types/chatFlow';

type Option = { label: string; next: string };
type Node = {
  id: string;
  message?: string;
  question?: string;
  answer?: string;
  options: Option[];
};

const NODES: Record<string, Node> = {
  start: {
    id: 'start',
    message: '', // Filled at runtime from ctx
    options: [
      { label: 'Online Bank Transfer', next: 'bank' },
      { label: 'QRPH Codes', next: 'qrph' },
      { label: 'End Chat', next: 'end' },
    ],
  },
  bank: {
    id: 'bank',
    message:
      'Here are our bank details. We only accept Instapay transfers.\n\nBPI: 1234-5678-90\nBDO: 0055-1234-5678\nUnionBank: 1092-3344-5566\n\nPlease upload your proof of payment using the file upload button beside the typing area to proceed.',
    options: [
      { label: 'QRPH Codes instead', next: 'qrph' },
      { label: 'End Chat', next: 'end' },
    ],
  },
  qrph: {
    id: 'qrph',
    message:
      'Here are QRPH codes: Gcash (/gcash.jpg) and Maya (/maya.jpg).\nPlease upload your proof of payment using the file upload button beside the typing area to proceed.',
    options: [
      { label: 'Online Bank Transfer instead', next: 'bank' },
      { label: 'End Chat', next: 'end' },
    ],
  },
  verifying: {
    id: 'verifying',
    answer:
      'Thank you for sending your proof of payment! Our team will confirm your payment shortly. You will be updated once payment has been confirmed and will be ready for pick up or delivery.',
    options: [
      { label: 'Pay Another Order', next: 'another' },
      { label: 'End Chat', next: 'end' },
    ],
  },
  another: {
    id: 'another',
    message:
      'Please provide/select another Order ID that is awaiting payment (e.g., ORD-12350).',
    options: [{ label: 'End Chat', next: 'end' }],
  },
  end: {
    id: 'end',
    answer: 'Thank you for chatting with Printy! Have a great day. 👋',
    options: [],
  },
};

let currentNodeId: keyof typeof NODES = 'start';

function nodeToMessages(node: Node): BotMessage[] {
  if (node.message) return [{ role: 'printy', text: node.message }];
  if (node.answer) return [{ role: 'printy', text: node.answer }];
  return [];
}

function nodeQuickReplies(node: Node): string[] {
  return node.options.map(o => o.label);
}

export const paymentFlow: ChatFlow = {
  id: 'payment',
  title: 'Payment',
  initial: (ctx?: { orderId?: string; total?: string }) => {
    currentNodeId = 'start';
    const intro =
      ctx?.orderId && ctx?.total
        ? [
            {
              role: 'printy',
              text: `Your total balance for ${ctx.orderId} is ${ctx.total}. How would you like to pay for your order?`,
            },
          ]
        : [
            {
              role: 'printy',
              text: 'How would you like to pay for your order?',
            },
          ];
    return intro as BotMessage[];
  },
  quickReplies: () => nodeQuickReplies(NODES[currentNodeId]),
  respond: async (_ctx, input) => {
    const normalized = input.trim().toLowerCase();
    // If input looks like an uploaded image/file URL or a base64 data URL, treat as proof
    const looksLikeProof =
      /blob:|data:image\//.test(input) || /(jpg|jpeg|png|gif)$/i.test(input);
    if (looksLikeProof) {
      currentNodeId = 'verifying';
      const node = NODES[currentNodeId];
      return {
        messages: nodeToMessages(node),
        quickReplies: nodeQuickReplies(node),
      };
    }

    const current = NODES[currentNodeId];
    const selection = current.options.find(
      o => o.label.toLowerCase() === normalized
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
    const node = NODES[currentNodeId];
    const messages = nodeToMessages(node);
    const quickReplies = nodeQuickReplies(node);
    if (currentNodeId === 'end') {
      return { messages, quickReplies: ['End Chat'] };
    }
    return { messages, quickReplies };
  },
};
