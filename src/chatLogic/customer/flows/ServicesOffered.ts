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
  services_start: {
    id: 'services_start',
    message:
      "Hi! I'm Printy 🤖. We offer a wide range of printing services. What would you like to know more about?",
    options: [
      { label: 'Business Cards', next: 'business_cards' },
      { label: 'Flyers & Brochures', next: 'flyers_brochures' },
      { label: 'Large Format Printing', next: 'large_format' },
      { label: 'Digital Printing', next: 'digital_printing' },
      { label: 'Offset Printing', next: 'offset_printing' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  business_cards: {
    id: 'business_cards',
    question: 'Business Cards',
    answer:
      'Our business cards are printed on premium cardstock with options for matte, glossy, or textured finishes. We offer standard sizes and custom dimensions. What would you like to know?',
    options: [
      { label: 'Pricing', next: 'pricing' },
      { label: 'Turnaround Time', next: 'turnaround' },
      { label: 'Other Services', next: 'other_services' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  flyers_brochures: {
    id: 'flyers_brochures',
    question: 'Flyers & Brochures',
    answer:
      'We print high-quality flyers and brochures on various paper weights and finishes. Perfect for marketing campaigns and informational materials. What would you like to know?',
    options: [
      { label: 'Pricing', next: 'pricing' },
      { label: 'Turnaround Time', next: 'turnaround' },
      { label: 'Other Services', next: 'other_services' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  large_format: {
    id: 'large_format',
    question: 'Large Format Printing',
    answer:
      'Our large format printing includes banners, posters, vehicle wraps, and signage. We use high-quality materials and advanced printing technology. What would you like to know?',
    options: [
      { label: 'Pricing', next: 'pricing' },
      { label: 'Turnaround Time', next: 'turnaround' },
      { label: 'Other Services', next: 'other_services' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  digital_printing: {
    id: 'digital_printing',
    question: 'Digital Printing',
    answer:
      'Digital printing is perfect for quick turnaround jobs, variable data printing, and short runs. We offer high-quality results with fast production times. What would you like to know?',
    options: [
      { label: 'Pricing', next: 'pricing' },
      { label: 'Turnaround Time', next: 'turnaround' },
      { label: 'Other Services', next: 'other_services' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  offset_printing: {
    id: 'offset_printing',
    question: 'Offset Printing',
    answer:
      'Offset printing is ideal for large quantities and provides superior color accuracy and consistency. Perfect for magazines, catalogs, and high-volume projects. What would you like to know?',
    options: [
      { label: 'Pricing', next: 'pricing' },
      { label: 'Turnaround Time', next: 'turnaround' },
      { label: 'Other Services', next: 'other_services' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  pricing: {
    id: 'pricing',
    question: 'Pricing',
    answer:
      'Pricing varies based on quantity, materials, finishes, and complexity. We offer competitive rates and volume discounts. Would you like a custom quote for your project?',
    options: [
      { label: 'Get Quote', next: 'get_quote' },
      { label: 'Other Services', next: 'other_services' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  turnaround: {
    id: 'turnaround',
    question: 'Turnaround Time',
    answer:
      'Our typical turnaround times are: Digital printing (1-3 days), Offset printing (5-10 days), Large format (3-7 days). Rush orders are available for additional fees.',
    options: [
      { label: 'Get Quote', next: 'get_quote' },
      { label: 'Other Services', next: 'other_services' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  other_services: {
    id: 'other_services',
    question: 'Other Services',
    answer:
      'We also offer binding, laminating, die-cutting, embossing, and finishing services. Is there a specific service you would like to know more about?',
    options: [
      { label: 'Get Quote', next: 'get_quote' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  get_quote: {
    id: 'get_quote',
    question: 'Get Quote',
    answer:
      'Great! I can help you get a quote. Please provide details about your project, including quantity, specifications, and timeline. Our team will review and send you a detailed quote.',
    options: [{ label: 'End Chat', next: 'end' }],
  },

  end: {
    id: 'end',
    answer: 'Thank you for chatting with Printy! Have a great day. 👋',
    options: [],
  },
};

let currentNodeId: keyof typeof NODES = 'services_start';

function nodeToMessages(node: Node): BotMessage[] {
  if (node.message) return [{ role: 'printy', text: node.message }];
  if (node.answer) return [{ role: 'printy', text: node.answer }];
  return [];
}

function nodeQuickReplies(node: Node): string[] {
  return node.options.map(o => o.label);
}

export const servicesOfferedFlow: ChatFlow = {
  id: 'services',
  title: 'Services Offered',
  initial: () => {
    currentNodeId = 'services_start';
    return nodeToMessages(NODES[currentNodeId]);
  },
  quickReplies: () => nodeQuickReplies(NODES[currentNodeId]),
  respond: async (_ctx, input) => {
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
    // If user chose End Chat option, still provide the closing message and a single End Chat button
    if (currentNodeId === 'end') {
      return { messages, quickReplies: ['End Chat'] };
    }
    return { messages, quickReplies };
  },
};
