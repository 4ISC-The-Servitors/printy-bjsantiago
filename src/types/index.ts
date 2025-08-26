// Base entity interface
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User profile interface
export interface Profile extends BaseEntity {
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: 'customer' | 'admin' | 'superadmin' | 'valued';
  preferences: Record<string, any>;
}

// Product interface
export interface Product extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  sku: string | null;
  barcode: string | null;
  inventory_quantity: number;
  weight: number | null;
  category_id: string | null;
  brand_id: string | null;
  status: 'active' | 'draft' | 'archived';
  tags: string[];
  images: string[];
  variants: ProductVariant[];
  seo_title: string | null;
  seo_description: string | null;
}

// Product variant interface
export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  inventory_quantity: number;
  attributes: Record<string, string>;
}

// Category interface
export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
}

// Brand interface
export interface Brand extends BaseEntity {
  name: string;
  logo: string | null;
  website: string | null;
  description: string | null;
  is_active: boolean;
}

// Order interface
export interface Order extends BaseEntity {
  order_number: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  shipping_address: Address;
  billing_address: Address | null;
  notes: string | null;
  tags: string[];
  source: string;
  currency: string;
  processed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

// Order status types
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'partially_paid'
  | 'refunded'
  | 'failed';

export type FulfillmentStatus = 
  | 'unfulfilled'
  | 'partial'
  | 'fulfilled'
  | 'shipped'
  | 'delivered';

// Address interface
export interface Address {
  street: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  phone?: string;
}

// Order item interface
export interface OrderItem extends BaseEntity {
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_image: string | null;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  quantity: number;
  total_amount: number;
}

// Cart item interface
export interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  total: number;
  in_stock: boolean;
}

// Conversation interface for chat
export interface Conversation extends BaseEntity {
  user_id: string | null;
  guest_id: string | null;
  topic: string;
  status: 'active' | 'resolved' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to: string | null;
  tags: string[];
  metadata: Record<string, any>;
}

// Chat message interface
export interface ChatMessage extends BaseEntity {
  conversation_id: string;
  sender_id: string | null;
  sender_type: 'user' | 'bot' | 'agent';
  message_type: 'text' | 'image' | 'file' | 'form_response';
  content: string;
  metadata: Record<string, any>;
  is_internal: boolean;
}

// Form response interface
export interface FormResponse extends BaseEntity {
  conversation_id: string;
  message_id: string;
  form_type: 'contact' | 'order' | 'support';
  form_data: Record<string, any>;
}

// API response interfaces
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter interfaces
export interface ProductFilters {
  category?: string;
  brand?: string;
  search?: string;
  priceRange?: [number, number];
  inStock?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'created_at' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  dateRange?: [string, string];
  search?: string;
}

// Form interfaces
export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface OrderForm {
  items: Array<{
    product_id: string;
    quantity: number;
    variant_id?: string;
  }>;
  customer: {
    email: string;
    phone?: string;
    name?: string;
  };
  shipping_address: Address;
  billing_address?: Address;
  notes?: string;
}

// UI state interfaces
export interface AppState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  language: string;
  cart: CartItem[];
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// Component prop interfaces
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps {
  label?: string;
  error?: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

// Animation interfaces
export interface AnimationProps {
  delay?: number;
  duration?: number;
  easing?: string;
  children: React.ReactNode;
}

// Performance interfaces
export interface PerformanceMetrics {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
}

// SEO interfaces
export interface SeoMetadata {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
}

// Notification interfaces
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// File upload interfaces
export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

// Search interfaces
export interface SearchResult<T> {
  item: T;
  score: number;
  highlights: Record<string, string[]>;
}

export interface SearchFilters {
  query: string;
  filters: Record<string, any>;
  sort: string;
  page: number;
  limit: number;
}
