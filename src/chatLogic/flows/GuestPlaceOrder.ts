import type { BotMessage, ChatFlow } from '../types'

type Option = { label: string; next: string }
type Node = {
  id: string
  message?: string
  question?: string
  answer?: string
  options: Option[]
}

const NODES: Record<string, Node> = {
  guest_place_order_start: {
    id: 'guest_place_order_start',
    message: "Hi! I'm Printy 🤖. To place an order, you need to have an account.",
    options: [
      { label: 'Let me sign up', next: 'sign_up' },
      { label: 'I already have an account', next: 'sign_in' },
      { label: 'End Chat', next: 'end' }, 
    ],
  },

  sign_up: {
    id: 'sign_up',
    question: 'Sign Up',
    answer: 'Redirecting to the sign up page...',
    options: [],
  },

  sign_in: {
    id: 'sign_in',
    question: 'Sign In',
    answer: 'Redirecting to the sign in page...',
    options: [],
  },

  end: {
    id: 'end',
    answer: 'Thank you for chatting with Printy! Have a great day. 👋',
    options: [],
  },
}

let currentNodeId: keyof typeof NODES = 'guest_place_order_start'

function nodeToMessages(node: Node): BotMessage[] {
  if (node.message) return [{ role: 'bot', text: node.message }]
  if (node.answer) return [{ role: 'bot', text: node.answer }]
  return []
}

function nodeQuickReplies(node: Node): string[] {
  return node.options.map((o) => o.label)
}

export const guestPlaceOrderFlow: ChatFlow = {
  id: 'guest_place_order',
  title: 'Guest Place Order',
  initial: () => {
    currentNodeId = 'guest_place_order_start'
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
        messages: [{ role: 'bot', text: 'Please choose one of the options.' }],
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