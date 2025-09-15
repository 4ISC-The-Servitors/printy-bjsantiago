export * from './selectionUtils';
export * from './statusColors';

// Admin-prefixed convenience exports (non-breaking)
export { default as adminSelectionUtils } from './selectionUtils';
export {
  getOrderStatusBadgeVariant as adminGetOrderStatusBadgeVariant,
  getTicketStatusBadgeVariant as adminGetTicketStatusBadgeVariant,
  getServiceStatusBadgeVariant as adminGetServiceStatusBadgeVariant,
} from './statusColors';
