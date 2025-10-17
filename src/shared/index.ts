/**
 * Shared Module Barrel Export
 * Central export point for all shared resources across the application
 */

// Re-export all hooks
export * from './hooks';

// Re-export all utils
export * from './utils';

// Re-export all types (except conflicting ones)
export type {
  BaseEntity,
  Profile,
  Product,
  ProductVariant,
  Category,
  Brand,
  Order,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  Address,
  OrderItem,
  CartItem,
  Conversation,
  ChatMessage,
  FormResponse,
  ApiResponse,
  ApiError,
  PaginatedResponse,
  ProductFilters,
  OrderFilters,
  ContactForm,
  OrderForm,
  AppState,
  CartState,
  AnimationProps,
  PerformanceMetrics,
  SeoMetadata,
  FileUpload,
  SearchResult,
  SearchFilters
} from './types';

// Re-export specialized types
export * from './types/chatFlow';
export * from './types/customer';
export * from './types/filters';

// Re-export all components
export * from './components';
