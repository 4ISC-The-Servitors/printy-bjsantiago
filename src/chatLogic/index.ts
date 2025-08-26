import type { ChatFlow } from './types'
import { aboutUsFlow } from './flows/AboutUs'
import { faqsFlow } from './flows/Faqs'
import { faqsFlow as guestFaqsFlow } from './flows/GuestFaqs'
import { guestPlaceOrderFlow } from './flows/GuestPlaceOrder'

export const flows: Record<string, ChatFlow> = {
  about: aboutUsFlow,
  faqs: faqsFlow,
  'guest-faqs': guestFaqsFlow,
  'guest-place-order': guestPlaceOrderFlow,
}

export function resolveFlowFromTopic(topicParam: string | null | undefined): ChatFlow {
  const normalized = (topicParam || 'about').toLowerCase()
  if (normalized.includes('about')) return aboutUsFlow
  if (normalized.includes('faq')) return faqsFlow
  if (normalized.includes('guest-faq')) return guestFaqsFlow
  if (normalized.includes('guest-place')) return guestPlaceOrderFlow
  return aboutUsFlow
}