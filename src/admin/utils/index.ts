// Admin utilities - re-export from shared location
export * from '@shared/utils/statusColors';

// Admin-prefixed convenience exports
export {
  getOrderStatusBadgeVariant as adminGetOrderStatusBadgeVariant,
  getTicketStatusBadgeVariant as adminGetTicketStatusBadgeVariant,
  getServiceStatusBadgeVariant as adminGetServiceStatusBadgeVariant,
} from '@shared/utils/statusColors';
