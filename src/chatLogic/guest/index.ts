import type { ChatFlow } from '../../types/chatFlow';
import { aboutUsFlow } from './flows/AboutUs';
import { guestFaqsFlow } from './flows/Faqs';
import { guestPlaceOrderFlow } from './flows/PlaceOrder';

export const guestFlows: Record<string, ChatFlow> = {
  about: aboutUsFlow,
  faqs: guestFaqsFlow,
  'place-order': guestPlaceOrderFlow,
};

export function resolveGuestFlow(topic: string | null | undefined): ChatFlow {
  const t = (topic || 'about').toLowerCase();
  if (t.includes('about')) return aboutUsFlow;
  if (t.includes('faq')) return guestFaqsFlow;
  if (t.includes('place')) return guestPlaceOrderFlow;
  return aboutUsFlow;
}
