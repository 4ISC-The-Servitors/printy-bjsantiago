import type { ChatFlow } from '../../types/chatFlow';
import { faqsFlow } from './flows/Faqs';
// import { issueTicketFlow } from './flows/IssueTicket'; // Migrated to JSON
import { placeOrderFlow } from './flows/PlaceOrder';
import { servicesOfferedFlow } from './flows/ServicesOffered';
// import { trackTicketFlow } from './flows/TrackTicket'; // Migrated to JSON
import { trackQuoteFlow } from './flows/TrackQuote';
import { paymentFlow } from './flows/Payment';
import { askQuoteFlow } from './flows/AskQuote';
import { loadJsonFlow, isJsonFlow } from './jsonFlowLoader';


// Note: 'about' is handled by the database-backed flow; exclude from scripted map
// Note: 'issue-ticket' and 'track-ticket' are now JSON-based flows
export const customerFlows: Record<string, ChatFlow> = {
  faqs: faqsFlow,
  'place-order': placeOrderFlow,
  'ask-quote': askQuoteFlow,
  services: servicesOfferedFlow,
  'track-quote': trackQuoteFlow,
  payment: paymentFlow,
};

// Load JSON flows
const jsonTrackTicket = loadJsonFlow('track-ticket');
const jsonIssueTicket = loadJsonFlow('issue-ticket');

if (jsonTrackTicket) {
  customerFlows['track-ticket'] = jsonTrackTicket;
}

if (jsonIssueTicket) {
  customerFlows['issue-ticket'] = jsonIssueTicket;
}

export function resolveCustomerFlow(
  topic: string | null | undefined
): ChatFlow {
  const t = (topic || 'about').toLowerCase();
  if (t.includes('faq')) return faqsFlow;
  if (t.includes('issue') || t.includes('ticket')) {
    return customerFlows['issue-ticket'] || faqsFlow;
  }
  if (t.includes('place') || t.includes('order')) return placeOrderFlow;
  if (t.includes('ask') && t.includes('quote')) return askQuoteFlow;
  if (t.includes('service')) return servicesOfferedFlow;
  if (t.includes('track') && t.includes('quote')) return trackQuoteFlow;
  if (t.includes('track')) {
    return customerFlows['track-ticket'] || faqsFlow;
  }
  if (t.includes('pay')) return paymentFlow;
  // default fallback to FAQs for scripted; About is DB-backed
  return faqsFlow;
}
