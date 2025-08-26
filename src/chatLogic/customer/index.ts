import type { ChatFlow } from '../../types/chatFlow';
import { aboutUsFlow } from './flows/AboutUs';
import { faqsFlow } from './flows/Faqs';

export const customerFlows: Record<string, ChatFlow> = {
  about: aboutUsFlow,
  faqs: faqsFlow,
};

export function resolveCustomerFlow(topic: string | null | undefined): ChatFlow {
  const t = (topic || 'about').toLowerCase();
  if (t.includes('about')) return aboutUsFlow;
  if (t.includes('faq')) return faqsFlow;
  return aboutUsFlow;
}
