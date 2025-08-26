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
  about_us_start: {
    id: 'about_us_start',
    message: "Hi! I'm Printy 🤖. What do you want to know about B.J. Santiago Inc.?",
    options: [
      { label: 'Can I know more about the history of the company?', next: 'company_history' },
      { label: 'How can I contact you?', next: 'contact_us' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  company_history: {
    id: 'company_history',
    question: 'Company History',
    answer: 'B.J. Santiago Inc. was founded in 1992 and has been serving numerous clients with offset, large-format, and digital printing.',
    options: [
      { label: 'How can I contact you?', next: 'contact_us' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  contact_us: {
    id: 'contact_us',
    question: 'Contact Us',
    answer: 'You can contact us at +63 917 123 4567.',
    options: [
      { label: 'Can I know more about the history of the company?', next: 'company_history' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  end: {
    id: 'end',
    answer: 'Thank you for chatting with Printy! Have a great day. 👋',
    options: [],
  },
}

let currentNodeId: keyof typeof NODES = 'about_us_start'

function nodeToMessages(node: Node): BotMessage[] {
  if (node.message) return [{ role: 'bot', text: node.message }]
  if (node.answer) return [{ role: 'bot', text: node.answer }]
  return []
}

function nodeQuickReplies(node: Node): string[] {
  return node.options.map((o) => o.label)
}

export const aboutUsFlow: ChatFlow = {
  id: 'about_us',
  title: 'About Us',
  initial: () => {
    currentNodeId = 'about_us_start'
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