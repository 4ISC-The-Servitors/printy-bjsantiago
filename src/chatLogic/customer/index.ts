import type { ChatFlow } from '../../types/chatFlow';
import { faqsFlow } from './flows/Faqs';
// import { issueTicketFlow } from './flows/IssueTicket'; // Migrated to DB-backed
import { placeOrderFlow } from './flows/PlaceOrder';
import { servicesOfferedFlow } from './flows/ServicesOffered';
// import { trackTicketFlow } from './flows/TrackTicket'; // Migrated to DB-backed
// import { trackQuoteFlow } from './flows/TrackQuote'; // Migrated to JSONB-backed
import { paymentFlow } from './flows/Payment';
// import { askQuoteFlow } from './flows/AskQuote'; // Migrated to DB-backed
// JSON flows removed; all flows are either scripted or JSONB-backed.

// Note: 'about', 'ask-quote', 'issue-ticket', 'track-ticket', and 'track-quote' are JSONB-backed flows
export const customerFlows: Record<string, ChatFlow> = {
  faqs: faqsFlow,
  'place-order': placeOrderFlow,
  // 'ask-quote' is now JSONB-backed
  services: servicesOfferedFlow,
  // 'track-quote' is now JSONB-backed
  payment: paymentFlow,
};

// No JSON flows to register

export function resolveCustomerFlow(
  topic: string | null | undefined
): ChatFlow {
  const t = (topic || 'about').toLowerCase();
  if (t.includes('faq')) return faqsFlow;
  if (t.includes('issue') || t.includes('ticket')) {
    // issue-ticket and track-ticket are JSONB-backed flows
    return faqsFlow; // fallback if called directly
  }
  if (t.includes('place') || t.includes('order')) return placeOrderFlow;
  if (t.includes('ask') && t.includes('quote')) {
    // ask-quote is now JSONB-backed
    return faqsFlow; // fallback if called directly
  }
  if (t.includes('service')) return servicesOfferedFlow;
  if (t.includes('track') && t.includes('quote')) {
    // track-quote is now JSONB-backed
    return faqsFlow; // fallback if called directly
  }
  if (t.includes('track')) {
    // track-ticket is JSONB-backed
    return faqsFlow; // fallback if called directly
  }
  if (t.includes('pay')) return paymentFlow;
  // default fallback to FAQs for scripted; About is JSONB-backed
  return faqsFlow;
}
