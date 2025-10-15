/**
 * Centralized filter types for all admin pages
 */

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterValue {
  statuses: string[];
  roles?: string[];
  dateFrom?: string; // yyyy-mm-dd
  dateTo?: string;   // yyyy-mm-dd
}

export interface FilterConfig {
  statusOptions: FilterOption[];
  roleOptions?: FilterOption[];
  showDateRange?: boolean;
  showStatusFilter?: boolean;
  showRoleFilter?: boolean;
}

// Order Status Options
export const ORDER_STATUS_OPTIONS: FilterOption[] = [
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'verifying_payment', label: 'Verifying Payment' },
  { value: 'reupload_payment_proof', label: 'Reupload Payment Proof' },
  { value: 'processing', label: 'Processing' },
  { value: 'for_delivery', label: 'For Delivery' },
  { value: 'for_pickup', label: 'For Pickup' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Quote Status Options
export const QUOTE_STATUS_OPTIONS: FilterOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'spec_proposed', label: 'Quote Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'ended', label: 'Ended' },
];

// Enhanced Ticket Status Options (with better context)
export const TICKET_STATUS_OPTIONS: FilterOption[] = [
  { value: 'new', label: 'New Request' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'pending_customer_reply', label: 'Pending Customer Reply' },
  { value: 'pending_admin_reply', label: 'Pending Admin Reply' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

// Customer Role Options
export const CUSTOMER_ROLE_OPTIONS: FilterOption[] = [
  { value: 'regular', label: 'Regular' },
  { value: 'valued', label: 'Valued' },
];

// Predefined filter configurations for different pages
export const FILTER_CONFIGS = {
  orders: {
    statusOptions: ORDER_STATUS_OPTIONS,
    showDateRange: true,
    showStatusFilter: true,
    showRoleFilter: false,
  } as FilterConfig,
  
  quotes: {
    statusOptions: QUOTE_STATUS_OPTIONS,
    showDateRange: true,
    showStatusFilter: true,
    showRoleFilter: false,
  } as FilterConfig,
  
  tickets: {
    statusOptions: TICKET_STATUS_OPTIONS,
    showDateRange: true,
    showStatusFilter: true,
    showRoleFilter: false,
  } as FilterConfig,
  
  customers: {
    roleOptions: CUSTOMER_ROLE_OPTIONS,
    showDateRange: true,
    showStatusFilter: false,
    showRoleFilter: true,
  } as FilterConfig,
} as const;

export type FilterConfigKey = keyof typeof FILTER_CONFIGS;
