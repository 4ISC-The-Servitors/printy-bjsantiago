// Status normalization utilities for all chat flows

export type OrderStatus =
  | 'awaiting_payment'
  | 'verifying_payment'
  | 'reupload_payment_proof'
  | 'processing'
  | 'for_delivery'
  | 'for_pickup'
  | 'completed'
  | 'cancelled';

export type ServiceStatus = 'Active' | 'Inactive' | 'Retired';

export type TicketStatus = 'Open' | 'Pending' | 'Closed';

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'awaiting_payment',
  'verifying_payment',
  'reupload_payment_proof',
  'processing',
  'for_delivery',
  'for_pickup',
  'completed',
  'cancelled',
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
  const t = (input || '').toLowerCase().replace(/[^a-z_]/g, '_');

  // Check for exact matches first (database format)
  if (t === 'awaiting_payment') return 'awaiting_payment';
  if (t === 'verifying_payment') return 'verifying_payment';
  if (t === 'reupload_payment_proof') return 'reupload_payment_proof';
  if (t === 'processing') return 'processing';
  if (t === 'for_delivery') return 'for_delivery';
  if (t === 'for_pickup') return 'for_pickup';
  if (t === 'completed') return 'completed';
  if (t === 'cancelled') return 'cancelled';

  // Check for formatted versions (frontend display format)
  if (t.includes('awaiting') && t.includes('payment')) return 'awaiting_payment';
  if (t.includes('verifying') && t.includes('payment')) return 'verifying_payment';
  if (t.includes('reupload') || t.includes('re_upload')) return 'reupload_payment_proof';
  if (t.includes('processing') || t.includes('in_production')) return 'processing';
  if (t.includes('delivery') && t.includes('pick')) return 'for_delivery';
  if (t.includes('delivery') && !t.includes('pick')) return 'for_delivery';
  if (t.includes('pickup') || t.includes('pick_up')) return 'for_pickup';
  if (t.includes('completed')) return 'completed';
  if (t.includes('cancelled')) return 'cancelled';

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
