export type BadgeVariant =
  | 'info'
  | 'warning'
  | 'secondary'
  | 'success'
  | 'error';

export const getTicketStatusBadgeVariant = (status: string): BadgeVariant => {
  const s = (status || '').toLowerCase();

  // Match actual database status values from inquiries table
  if (s === 'new') return 'info';
  if (s === 'under_review') return 'warning';
  if (s === 'pending_customer_reply') return 'warning';
  if (s === 'pending_admin_reply') return 'info';
  if (s === 'resolved') return 'success';
  if (s === 'closed') return 'secondary';

  // Fallback for any other status
  return 'secondary';
};

export const getOrderStatusBadgeVariant = (status: string): BadgeVariant => {
  const s = (status || '').toLowerCase();

  // Match actual database status values from orders table
  if (s === 'awaiting_payment') return 'warning';
  if (s === 'verifying_payment') return 'info';
  if (s === 'reupload_payment') return 'warning';
  if (s === 'processing') return 'info';
  if (s === 'for_delivery') return 'info';
  if (s === 'for_pickup') return 'info';
  if (s === 'completed') return 'success';
  if (s === 'cancelled') return 'error';

  // Fallback for any other status
  return 'secondary';
};

export const getQuoteStatusBadgeVariant = (status: string): BadgeVariant => {
  const s = (status || '').toLowerCase();

  // Match actual database status values from quotes table
  if (s === 'active') return 'info';
  if (s === 'spec_proposed') return 'warning';
  if (s === 'accepted') return 'success';
  if (s === 'rejected') return 'error';
  if (s === 'ended') return 'secondary';

  // Fallback for any other status
  return 'secondary';
};

export const getServiceStatusBadgeVariant = (status: string): BadgeVariant => {
  const s = (status || '').toLowerCase();
  if (s === 'active') return 'success';
  if (s === 'inactive') return 'warning';
  if (s === 'retired') return 'secondary';
  return 'secondary';
};

export const getChatStatusBadgeVariant = (status: string): BadgeVariant => {
  const s = (status || '').toLowerCase();
  if (s === 'active') return 'success';
  if (s === 'ended') return 'error';
  return 'secondary';
};
