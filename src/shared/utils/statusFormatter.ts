/**
 * Formats snake_case status strings to display-friendly text
 * Examples:
 * - "awaiting_payment" -> "Awaiting Payment"
 * - "in_progress" -> "In Progress"
 * - "completed" -> "Completed"
 */
export function formatStatus(status: string): string {
  if (!status) return '';

  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats order status with specific business logic
 */
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    awaiting_payment: 'Awaiting Payment',
    verifying_payment: 'Verifying Payment',
    reupload_payment: 'Reupload Payment',
    reupload_payment_proof: 'Reupload Payment',
    processing: 'Processing',
    for_delivery: 'For Delivery',
    for_pickup: 'For Pickup',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return statusMap[status.toLowerCase()] || formatStatus(status);
}

/**
 * Formats ticket/inquiry status
 */
export function formatTicketStatus(status: string): string {
  const statusMap: Record<string, string> = {
    new: 'New',
    under_review: 'Under Review',
    pending_customer_reply: 'Pending Customer Reply',
    pending_admin_reply: 'Pending Admin Reply',
    resolved: 'Resolved',
    closed: 'Closed',
  };

  return statusMap[status.toLowerCase()] || formatStatus(status);
}

/**
 * Formats quote conversation status
 */
export function formatQuoteStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Active',
    spec_proposed: 'Quote Sent',
    accepted: 'Accepted',
    rejected: 'Rejected',
    ended: 'Ended',
  };

  return statusMap[status.toLowerCase()] || formatStatus(status);
}

/**
 * Formats chat conversation status
 */
export function formatChatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Active',
    ended: 'Ended',
  };

  return statusMap[status.toLowerCase()] || formatStatus(status);
}

/**
 * Formats inquiry/ticket types for display
 */
export function formatInquiryType(type: string): string {
  const typeMap: Record<string, string> = {
    quality: 'Printing Quality Issue',
    delivery: 'Delivery / Pickup Inquiry',
    billing: 'Billing Problem',
    other: 'Other Concerns',
  };

  return typeMap[type.toLowerCase()] || formatStatus(type);
}
