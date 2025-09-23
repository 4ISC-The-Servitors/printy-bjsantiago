export type BadgeVariant =
  | 'info'
  | 'warning'
  | 'secondary'
  | 'success'
  | 'error';

export const getTicketStatusBadgeVariant = (status: string): BadgeVariant => {
  const s = (status || '').toLowerCase();
  if (s === 'open') return 'info';
  if (s === 'pending' || s === 'in progress' || s === 'awaiting')
    return 'warning';
  return 'secondary';
};

export const getOrderStatusBadgeVariant = (status: string): BadgeVariant => {
  const s = (status || '').toLowerCase();
  if (s === 'processing') return 'info';
  if (s === 'awaiting quote approval') return 'warning';
  if (s === 'awaiting payment') return 'warning';
  if (s === 'verifying payment') return 'info';
  if (s === 'for delivery/pick-up' || s === 'for delivery' || s === 'pick-up')
    return 'info';
  if (s === 'completed') return 'success';
  if (s === 'cancelled') return 'error';
  return 'secondary';
};

export const getServiceStatusBadgeVariant = (status: string): BadgeVariant => {
  const s = (status || '').toLowerCase();
  if (s === 'active') return 'success';
  if (s === 'inactive') return 'warning';
  if (s === 'retired') return 'secondary';
  return 'secondary';
};
