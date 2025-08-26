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
  guest_faqs_start: {
    id: 'guest_faqs_start',
    message: "Hi! I'm Printy 🤖. What do you want to know?",
    options: [
      { label: 'Pricing', next: 'pricing' },
      { label: 'Turnaround Time', next: 'turnaround' },
      { label: 'File Formats', next: 'file_formats' },
      { label: 'Other Concerns', next: 'other_concerns' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  pricing: {
    id: 'pricing',
    question: 'Pricing',
    answer: 'Pricing depends on quantity, material, and finish.',
    options: [
      { label: 'Turnaround Time', next: 'turnaround' },
      { label: 'File Formats', next: 'file_formats' },
      { label: 'Other Concerns', next: 'other_concerns' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  turnaround: {
    id: 'turnaround',
    question: 'Turnaround Time',
    answer: 'Most jobs complete within 3–5 business days.',
    options: [
      { label: 'Pricing', next: 'pricing' },
      { label: 'File Formats', next: 'file_formats' },
      { label: 'Other Concerns', next: 'other_concerns' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  file_formats: {
    id: 'file_formats',
    question: 'File Formats',
    answer: 'We accept PDF, AI, PSD, and high-resolution JPEG.',
    options: [
      { label: 'Pricing', next: 'pricing' },
      { label: 'Turnaround Time', next: 'turnaround' },
      { label: 'Other Concerns', next: 'other_concerns' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  other_concerns: {
    id: 'other_concerns',
    question: 'I have another concern',
    answer:
      "Unfortunately, I can't assist with that.",
    options: [
      { label: 'Call our hotline', next: 'call_hotline' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  call_hotline: {
    id: 'call_hotline',
    question: 'Contact Us',
    answer: 'You can contact us at +63 917 123 4567.',
    options: [
      { label: 'Unable to contact your hotline', next: 'unable_to_contact' },
      { label: 'End Chat', next: 'end' },
    ],
  },

  unable_to_contact: {
    id: 'unable_to_contact',
    question: 'Unable to contact your hotline',
    answer: 'I am sorry to hear that. Please try again later.',
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

let currentNodeId: keyof typeof NODES = 'guest_faqs_start'

function nodeToMessages(node: Node): BotMessage[] {
  if (node.message) return [{ role: 'bot', text: node.message }]
  if (node.answer) return [{ role: 'bot', text: node.answer }]
  return []
}

function nodeQuickReplies(node: Node): string[] {
  return node.options.map((o) => o.label)
}

export const faqsFlow: ChatFlow = {
  id: 'guest_faqs',
  title: 'Guest FAQs',
  initial: () => {
    currentNodeId = 'guest_faqs_start'
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