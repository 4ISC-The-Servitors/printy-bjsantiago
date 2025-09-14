// Status normalization utilities for all chat flows

export type OrderStatus =
  | 'Pending'
  | 'Processing'
  | 'Awaiting Payment'
  | 'For Delivery/Pick-up'
  | 'Completed'
  | 'Cancelled';

export type ServiceStatus = 'Active' | 'Inactive' | 'Retired';

export type TicketStatus = 'Open' | 'Pending' | 'Closed';

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'Pending',
  'Processing',
  'Awaiting Payment',
  'For Delivery/Pick-up',
  'Completed',
  'Cancelled',
];

export const SERVICE_STATUS_OPTIONS: ServiceStatus[] = [
  'Active',
  'Inactive',
  'Retired',
];

export const TICKET_STATUS_OPTIONS: TicketStatus[] = [
  'Open',
  'Pending',
  'Closed',
];

export function normalizeOrderStatus(input: string): OrderStatus | null {
  const t = (input || '').toLowerCase();

  // Check for exact matches first
  if (t === 'pending') return 'Pending';
  if (t === 'processing') return 'Processing';
  if (t === 'awaiting payment') return 'Awaiting Payment';
  if (t === 'for delivery/pick-up') return 'For Delivery/Pick-up';
  if (t === 'completed') return 'Completed';
  if (t === 'cancelled') return 'Cancelled';

  // Then check for partial matches
  if (t.startsWith('pend')) return 'Pending';
  if (t.startsWith('proc')) return 'Processing';
  if (t.startsWith('await') || t.startsWith('payment'))
    return 'Awaiting Payment';
  if (
    t.startsWith('deliver') ||
    t.startsWith('pick') ||
    t.startsWith('for delivery')
  )
    return 'For Delivery/Pick-up';
  if (t.startsWith('comp')) return 'Completed';
  if (t.startsWith('cancel')) return 'Cancelled';
  return null;
}

export function normalizeServiceStatus(input: string): ServiceStatus | null {
  const t = (input || '').toLowerCase();

  // Check for exact matches first
  if (t === 'active') return 'Active';
  if (t === 'inactive') return 'Inactive';
  if (t === 'retired') return 'Retired';

  // Then check for partial matches
  if (t.startsWith('act')) return 'Active';
  if (t.startsWith('inact') || t.startsWith('deac') || t.startsWith('dis'))
    return 'Inactive';
  if (t.startsWith('ret') || t.startsWith('arch')) return 'Retired';
  return null;
}

export function normalizeTicketStatus(input: string): TicketStatus | null {
  const t = (input || '').toLowerCase();

  // Check for exact matches first
  if (t === 'open') return 'Open';
  if (t === 'pending') return 'Pending';
  if (t === 'closed') return 'Closed';

  // Then check for partial matches
  if (t.startsWith('open')) return 'Open';
  if (t.startsWith('pend')) return 'Pending';
  if (t.startsWith('clos')) return 'Closed';
  return null;
}
