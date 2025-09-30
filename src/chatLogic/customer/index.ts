import type { ChatFlow } from '../../types/chatFlow';
import { faqsFlow } from './flows/Faqs';
import { issueTicketFlow } from './flows/IssueTicket';
import { placeOrderFlow } from './flows/PlaceOrder';
import { servicesOfferedFlow } from './flows/ServicesOffered';
import { trackTicketFlow } from './flows/TrackTicket';
import { paymentFlow } from './flows/Payment';
import { cancelOrderFlow } from './flows/CancelOrder';

// Note: 'about' is handled by the database-backed flow; exclude from scripted map
export const customerFlows: Record<string, ChatFlow> = {
  faqs: faqsFlow,
  'issue-ticket': issueTicketFlow,
  'place-order': placeOrderFlow,
  services: servicesOfferedFlow,
  'track-ticket': trackTicketFlow,
  payment: paymentFlow,
  'cancel-order': cancelOrderFlow,
};

export function resolveCustomerFlow(
  topic: string | null | undefined
): ChatFlow {
  const t = (topic || 'about').toLowerCase();
  if (t.includes('faq')) return faqsFlow;
  if (t.includes('issue') || t.includes('ticket')) return issueTicketFlow;
  if (t.includes('place') || t.includes('order')) return placeOrderFlow;
  if (t.includes('service')) return servicesOfferedFlow;
  if (t.includes('track')) return trackTicketFlow;
  if (t.includes('pay')) return paymentFlow;
  if (t.includes('cancel')) return cancelOrderFlow;
  // default fallback to FAQs for scripted; About is DB-backed
  return faqsFlow;
}
