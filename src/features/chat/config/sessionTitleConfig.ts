/**
 * Centralized Session Title Configuration
 *
 * Single source of truth for all chat session title generation.
 * Ensures consistent titles across customer and admin interfaces.
 */

// Flow ID to Display Title mapping
// NOTE: Only includes flows that exist in chat_flows_v2 table
export const FLOW_TITLES: Record<string, string> = {
  // Customer flows (verified in database)
  'ask-quote': 'Ask Quote',
  'track-quote': 'Track Quote',
  'track-ticket': 'Track Ticket',
  'pay-order': 'Pay Order',
  'reupload-payment': 'Reupload Payment',
  'issue-ticket': 'Ask Assistance',

  // Admin flows (verified in database)
  'admin-quote-propose': 'Quote Propose',
  'admin-create-order': 'Create Order',
  'admin-verify-payment': 'Verify Payment',
  'admin-review-ticket': 'Review Ticket',

  // Flows not in database - commented out
  //'cancel-order': 'Cancel Order', // Not in chat_flows_v2
  //'about': 'About B.J. Santiago', // Not in chat_flows_v2
  //'faqs': 'FAQs', // Not in chat_flows_v2
  //'services': 'Services Offered', // Not in chat_flows_v2
};

interface SessionTitleParams {
  flowId: string;
  metadata?: {
    title?: string;
    context?: {
      display_id?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  inquiry?: { display_id?: string };
  quote?: { display_id?: string };
  order?: { display_id?: string };
}

/**
 * Centralized title generation logic
 *
 * Priority order:
 * 1. metadata.title (explicitly set title)
 * 2. context display_id (e.g., "Track Quote: QOT-100001")
 * 3. Foreign key display_id (admin flows with FK relationships)
 * 4. Flow mapping fallback (FLOW_TITLES)
 * 5. Last resort: flow_id or 'Chat'
 *
 * @param params - Session title parameters
 * @returns Human-readable session title
 */
export function getSessionTitle(params: SessionTitleParams): string {
  const { flowId, metadata, inquiry, quote, order } = params;

  // 1. Highest priority: Explicitly set title in metadata
  if (metadata?.title) {
    return metadata.title;
  }

  // 2. Context-based title with display_id
  if (metadata?.context?.display_id) {
    const baseTitle = FLOW_TITLES[flowId] || flowId;
    return `${baseTitle}: ${metadata.context.display_id}`;
  }

  // 3. Foreign key relationships (admin flows)
  if (quote?.display_id) {
    return `Quote: ${quote.display_id}`;
  }
  if (order?.display_id) {
    return `Order: ${order.display_id}`;
  }
  if (inquiry?.display_id) {
    return `Ticket: ${inquiry.display_id}`;
  }

  // 4. Flow mapping fallback
  if (FLOW_TITLES[flowId]) {
    return FLOW_TITLES[flowId];
  }

  // 5. Last resort: Use flow_id or generic 'Chat'
  return flowId || 'Chat';
}
