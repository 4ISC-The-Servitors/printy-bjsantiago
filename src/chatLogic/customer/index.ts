import type { ChatFlow } from '../../types/chatFlow';
import { aboutUsFlow } from './flows/AboutUs';
import { faqsFlow } from './flows/Faqs';
import { issueTicketFlow } from './flows/IssueTicket';
import { placeOrderFlow } from './flows/PlaceOrder';
import { servicesOfferedFlow } from './flows/ServicesOffered';
import { trackTicketFlow } from './flows/TrackTicket';

export const customerFlows: Record<string, ChatFlow> = {
  about: aboutUsFlow,
  faqs: faqsFlow,
  'issue-ticket': issueTicketFlow,
  'place-order': placeOrderFlow,
  services: servicesOfferedFlow,
  'track-ticket': trackTicketFlow,
};

export function resolveCustomerFlow(topic: string | null | undefined): ChatFlow {
  const t = (topic || 'about').toLowerCase();
  if (t.includes('about')) return aboutUsFlow;
  if (t.includes('faq')) return faqsFlow;
  if (t.includes('issue') || t.includes('ticket')) return issueTicketFlow;
  if (t.includes('place') || t.includes('order')) return placeOrderFlow;
  if (t.includes('service')) return servicesOfferedFlow;
  if (t.includes('track')) return trackTicketFlow;
  return aboutUsFlow;
}
