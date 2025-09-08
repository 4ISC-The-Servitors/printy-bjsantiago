import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { createOrder } from '../../../api/orderApi';
import type { OrderData } from '../../../api/orderApi';

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
      "Hi! I'm Printy 🤖. I'll help you place an order. What type of printing service do you need?",
    options: [
      { label: 'Business Cards', next: 'business_cards' },
      { label: 'Flyers & Brochures', next: 'flyers_brochures' },
      { label: 'Large Format Printing', next: 'large_format' },
      { label: 'Digital Printing', next: 'digital_printing' },
      { label: 'Other Service', next: 'other_service' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  business_cards: {
    id: 'business_cards',
    question: 'Business Cards',
    answer:
      'Great choice! Business cards are our specialty. What quantity do you need?',
    options: [
      { label: '100-500 cards', next: 'quantity_100_500' },
      { label: '500-1000 cards', next: 'quantity_500_1000' },
      { label: '1000+ cards', next: 'quantity_1000_plus' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  flyers_brochures: {
    id: 'flyers_brochures',
    question: 'Flyers & Brochures',
    answer:
      'Excellent! We offer high-quality flyers and brochures. What is your target quantity?',
    options: [
      { label: '100-500 pieces', next: 'quantity_100_500' },
      { label: '500-1000 pieces', next: 'quantity_500_1000' },
      { label: '1000+ pieces', next: 'quantity_1000_plus' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  large_format: {
    id: 'large_format',
    question: 'Large Format Printing',
    answer:
      'Perfect! We handle banners, posters, and large displays. What size do you need?',
    options: [
      { label: 'Small (A3-A2)', next: 'size_small' },
      { label: 'Medium (A1-A0)', next: 'size_medium' },
      { label: 'Large (Custom)', next: 'size_large' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  digital_printing: {
    id: 'digital_printing',
    question: 'Digital Printing',
    answer:
      'Great! Digital printing is perfect for quick turnaround jobs. What is your project?',
    options: [
      { label: 'Documents', next: 'documents' },
      { label: 'Photos', next: 'photos' },
      { label: 'Artwork', next: 'artwork' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  other_service: {
    id: 'other_service',
    question: 'Other Service',
    answer:
      "I'm here to help with any other printing needs. Please describe what you're looking for.",
    options: [
      { label: 'Submit inquiry', next: 'submit_inquiry' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  quantity_100_500: {
    id: 'quantity_100_500',
    question: '100-500 Pieces',
    answer:
      'Good quantity! This range typically takes 3-5 business days. Would you like me to create a quote for you?',
    options: [
      { label: 'Yes, create quote', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  quantity_500_1000: {
    id: 'quantity_500_1000',
    question: '500-1000 Pieces',
    answer:
      'Great volume! This range typically takes 5-7 business days. Should I prepare a quote?',
    options: [
      { label: 'Yes, create quote', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  quantity_1000_plus: {
    id: 'quantity_1000_plus',
    question: '1000+ Pieces',
    answer:
      'Excellent! For large quantities, we offer special pricing and 7-10 business day turnaround. Ready for a quote?',
    options: [
      { label: 'Yes, create quote', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  size_small: {
    id: 'size_small',
    question: 'Small Size (A3-A2)',
    answer:
      'Perfect! Small formats are quick to produce. Would you like a quote for this project?',
    options: [
      { label: 'Yes, create quote', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  size_medium: {
    id: 'size_medium',
    question: 'Medium Size (A1-A0)',
    answer:
      'Great choice! Medium formats offer good visibility. Should I prepare a quote for you?',
    options: [
      { label: 'Yes, create quote', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  size_large: {
    id: 'size_large',
    question: 'Large Size (Custom)',
    answer:
      'Impressive! Custom large formats make a statement. Ready for a custom quote?',
    options: [
      { label: 'Yes, create quote', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  documents: {
    id: 'documents',
    question: 'Documents',
    answer:
      'Perfect! We handle all types of documents with quick turnaround. Would you like a quote?',
    options: [
      { label: 'Yes, create quote', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  photos: {
    id: 'photos',
    question: 'Photos',
    answer:
      'Excellent! We offer high-quality photo printing on various papers. Ready for a quote?',
    options: [
      { label: 'Yes, create quote', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  artwork: {
    id: 'artwork',
    question: 'Artwork',
    answer:
      'Wonderful! We love working with artists. We can print on canvas, fine art paper, and more. Should I create a quote?',
    options: [
      { label: 'Yes, create quote', next: 'create_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  create_quote: {
    id: 'create_quote',
    question: 'Create Quote',
    answer:
      "Perfect! I've started creating a quote for you. Our team will review your requirements and send you a detailed quote within 2 hours.",
    options: [{ label: 'End Chat', next: 'end' }],
  },

  submit_inquiry: {
    id: 'submit_inquiry',
    question: 'Submit Inquiry',
    answer:
      "Thank you for your inquiry! I've submitted it to our team. We'll review your requirements and get back to you within 24 hours.",
    options: [{ label: 'End Chat', next: 'end' }],
  },

  end: {
    id: 'end',
    answer: 'Thank you for chatting with Printy! Have a great day. 👋',
    options: [],
  },
};

let currentNodeId: keyof typeof NODES = 'place_order_start';

function nodeToMessages(node: Node): BotMessage[] {
  if (node.message) return [{ role: 'printy', text: node.message }];
  if (node.answer) return [{ role: 'printy', text: node.answer }];
  return [];
}

function nodeQuickReplies(node: Node): string[] {
  return node.options.map(o => o.label);
}

export const placeOrderFlow: ChatFlow = {
  id: 'place-order',
  title: 'Place an Order',
  initial: () => {
    currentNodeId = 'place_order_start';
    return nodeToMessages(NODES[currentNodeId]);
  },
  quickReplies: () => nodeQuickReplies(NODES[currentNodeId]),
  respond: async (ctx, input) => {
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
    const node = NODES[currentNodeId];
    const messages = nodeToMessages(node);
    const quickReplies = nodeQuickReplies(node);

    // Trigger createOrder when reaching 'create_quote'
    if (currentNodeId === 'create_quote') {
      const order: OrderData = {
        service_id: typeof ctx.serviceId === 'string' ? ctx.serviceId : 'default_service_id',
        customer_id: typeof ctx.customerId === 'string' ? ctx.customerId : 'default_customer_id',
        order_status: 'pending',
        delivery_mode: typeof ctx.deliveryMode === 'string' ? ctx.deliveryMode : 'pickup',
        order_date_time: new Date().toISOString(),
        completed_date_time: null,
        page_size: typeof ctx.pageSize === 'string' ? ctx.pageSize : 'A4',
        quantity: typeof ctx.quantity === 'number' ? ctx.quantity : 100,
        priority_level: typeof ctx.priorityLevel === 'string' ? ctx.priorityLevel : 'normal',
      };
      await createOrder(order);
    }

    // If user chose End Chat option, still provide the closing message and a single End Chat button
    if (currentNodeId === 'end') {
      return { messages, quickReplies: ['End Chat'] };
    }
    return { messages, quickReplies };
  },
};
