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
  'place-order': 'Place Order',
  'services-offered': 'Services Offered',
  faqs: 'FAQs',
  'about-us': 'About B.J. Santiago Inc. ',

  // Admin flows (verified in database)
  'admin-quote-propose': 'Quote Proposal',
  'admin-create-order': 'Order Creation',
  'admin-verify-payment': 'Payment Verification',
  'admin-review-ticket': 'Ticket Review',
  'admin-change-order-status': 'Order Status Update',
  'admin-add-service': 'Add Service',
  'admin-update-service': 'Update Service',

  // Flows not in database - commented out
  //'cancel-order': 'Cancel Order', // Not in chat_flows_v2
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
 * Helper function to check if a string looks like a UUID
 */
function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Helper function to format display ID for UI (avoid showing UUIDs)
 */
function formatDisplayId(displayId: string): string {
  if (isUUID(displayId)) {
    // For UUIDs, show first 8 characters with ellipsis
    return `${displayId.substring(0, 8)}...`;
  }
  return displayId;
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
    const displayId = formatDisplayId(metadata.context.display_id);
    return `${baseTitle}: ${displayId}`;
  }

  // 3. Foreign key relationships (admin flows)
  if (quote?.display_id) {
    const displayId = formatDisplayId(quote.display_id);
    return `Quote: ${displayId}`;
  }
  if (order?.display_id) {
    const displayId = formatDisplayId(order.display_id);
    return `Order: ${displayId}`;
  }
  if (inquiry?.display_id) {
    const displayId = formatDisplayId(inquiry.display_id);
    return `Ticket: ${displayId}`;
  }

  // 4. Flow mapping fallback
  if (FLOW_TITLES[flowId]) {
    return FLOW_TITLES[flowId];
  }

  // 5. Last resort: Use flow_id or generic 'Chat'
  return flowId || 'Chat';
}
