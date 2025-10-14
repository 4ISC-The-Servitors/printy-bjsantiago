import type { ChatFlow } from '../../types/chatFlow';
import { faqsFlow } from './flows/Faqs';
// import { issueTicketFlow } from './flows/IssueTicket'; // DB-backed now; scripted disabled
import { placeOrderFlow } from './flows/PlaceOrder';
import { servicesOfferedFlow } from './flows/ServicesOffered';
import { trackTicketFlow } from './flows/TrackTicket';
import { trackQuoteFlow } from './flows/TrackQuote';
import { paymentFlow } from './flows/Payment';
import { askQuoteFlow } from './flows/AskQuote';


// Note: 'about' is handled by the database-backed flow; exclude from scripted map
export const customerFlows: Record<string, ChatFlow> = {
  faqs: faqsFlow,
  // 'issue-ticket': issueTicketFlow, // use database-backed flow instead
  'place-order': placeOrderFlow,
  'ask-quote': askQuoteFlow,
  services: servicesOfferedFlow,
  'track-ticket': trackTicketFlow,
  'track-quote': trackQuoteFlow,
  payment: paymentFlow,
};

export function resolveCustomerFlow(
  topic: string | null | undefined
): ChatFlow {
  const t = (topic || 'about').toLowerCase();
  if (t.includes('faq')) return faqsFlow;
  // if (t.includes('issue') || t.includes('ticket')) return issueTicketFlow; // DB-backed
  if (t.includes('place') || t.includes('order')) return placeOrderFlow;
  if (t.includes('ask') && t.includes('quote')) return askQuoteFlow;
  if (t.includes('service')) return servicesOfferedFlow;
  if (t.includes('track') && t.includes('quote')) return trackQuoteFlow;
  if (t.includes('track')) return trackTicketFlow;
  if (t.includes('pay')) return paymentFlow;
  // default fallback to FAQs for scripted; About is DB-backed
  return faqsFlow;
}
