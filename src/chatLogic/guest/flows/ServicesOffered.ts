import type { BotMessage, ChatFlow } from '../../../types/chatFlow'

type Option = { label: string; next: string }
type Node = {
  id: string
  message?: string
  question?: string
  answer?: string
  options: Option[]
}

const NODES: Record<string, Node> = {
  guest_services_start: {
    id: 'guest_services_start',
    message: "Hi! I'm Printy 🤖. We offer a wide range of printing services. What would you like to know more about?",
    options: [
      { label: 'Business Cards', next: 'business_cards' },
      { label: 'Flyers & Brochures', next: 'flyers_brochures' },
      { label: 'Large Format Printing', next: 'large_format' },
      { label: 'Digital Printing', next: 'digital_printing' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  business_cards: {
    id: 'business_cards',
    question: 'Business Cards',
    answer: 'Our business cards are printed on premium cardstock with options for matte, glossy, or textured finishes. We offer standard sizes and custom dimensions.',
    options: [
      { label: 'Other Services', next: 'other_services' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  flyers_brochures: {
    id: 'flyers_brochures',
    question: 'Flyers & Brochures',
    answer: 'We print high-quality flyers and brochures on various paper weights and finishes. Perfect for marketing campaigns and informational materials.',
    options: [
      { label: 'Other Services', next: 'other_services' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  large_format: {
    id: 'large_format',
    question: 'Large Format Printing',
    answer: 'Our large format printing includes banners, posters, vehicle wraps, and signage. We use high-quality materials and advanced printing technology.',
    options: [
      { label: 'Other Services', next: 'other_services' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  digital_printing: {
    id: 'digital_printing',
    question: 'Digital Printing',
    answer: 'Digital printing is perfect for quick turnaround jobs, variable data printing, and short runs. We offer high-quality results with fast production times.',
    options: [
      { label: 'Other Services', next: 'other_services' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  other_services: {
    id: 'other_services',
    question: 'Other Services',
    answer: 'We also offer binding, laminating, die-cutting, embossing, and finishing services. To get detailed pricing and place orders, you will need to create an account.',
    options: [
      { label: 'Create Account', next: 'create_account' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  create_account: {
    id: 'create_account',
    question: 'Create Account',
    answer: 'Great idea! Creating an account will give you access to detailed pricing, order tracking, and exclusive customer benefits. Would you like to sign up now?',
    options: [
      { label: 'End Chat', next: 'end' },
    ],
  },

  end: {
    id: 'end',
    answer: 'Thank you for chatting with Printy! Have a great day. 👋',
    options: [],
  },
}

let currentNodeId: keyof typeof NODES = 'guest_services_start'

function nodeToMessages(node: Node): BotMessage[] {
  if (node.message) return [{ role: 'printy', text: node.message }]
  if (node.answer) return [{ role: 'printy', text: node.answer }]
  return []
}

function nodeQuickReplies(node: Node): string[] {
  return node.options.map((o) => o.label)
}

export const guestServicesOfferedFlow: ChatFlow = {
  id: 'guest-services',
  title: 'Services Offered',
  initial: () => {
    currentNodeId = 'guest_services_start'
    return nodeToMessages(NODES[currentNodeId])
  },
  quickReplies: () => nodeQuickReplies(NODES[currentNodeId]),
  respond: async (_ctx, input) => {
    const current = NODES[currentNodeId]
    const selection = current.options.find(
      (o) => o.label.toLowerCase() === input.trim().toLowerCase()
    )
    if (!selection) {
      return {
        messages: [{ role: 'printy', text: 'Please choose one of the options.' }],
        quickReplies: nodeQuickReplies(current),
      }
    }
    currentNodeId = selection.next as keyof typeof NODES
    const node = NODES[currentNodeId]
    const messages = nodeToMessages(node)
    const quickReplies = nodeQuickReplies(node)
    // If user chose End Chat option, still provide the closing message and a single End Chat button
    if (currentNodeId === 'end') {
      return { messages, quickReplies: ['End Chat'] }
    }
    return { messages, quickReplies }
  },
}
