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
  if (s === 'open') return 'info';
  if (s === 'in_progress') return 'warning';
  if (s === 'not resolved') return 'error';
  
  // Fallback for any other status
  return 'secondary';
};

export const getOrderStatusBadgeVariant = (status: string): BadgeVariant => {
  const s = (status || '').toLowerCase();
  
  // Match actual database status values from orders table
  if (s === 'awaiting_payment') return 'warning';
  if (s === 'verifying_payment') return 'info';
  if (s === 'reupload_payment_proof') return 'error';
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
