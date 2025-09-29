// BACKEND_TODO: selectionUtils references selection items built from mocks in some pages.
// Ensure selections are driven by live Supabase data when backend is wired.
export * from './selectionUtils';
export * from './statusColors';

// Admin-prefixed convenience exports (non-breaking)
// selectionUtils does not have a default export; expose a namespaced object for convenience
import * as selectionUtils from './selectionUtils';
export const adminSelectionUtils = selectionUtils;
export {
  getOrderStatusBadgeVariant as adminGetOrderStatusBadgeVariant,
  getTicketStatusBadgeVariant as adminGetTicketStatusBadgeVariant,
  getServiceStatusBadgeVariant as adminGetServiceStatusBadgeVariant,
} from './statusColors';
