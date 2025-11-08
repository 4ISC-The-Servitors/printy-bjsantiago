/**
 * Service-related type definitions
 * Used for printing services and categories throughout the application
 */

export interface ServiceCategory {
  category_id: string;
  category_name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  created_by_user?: {
    first_name: string | null;
    last_name: string | null;
  };
  updated_by_user?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export interface PrintingService {
  service_id: string;
  display_id: string;
  service_name: string;
  category_id: string;
  category?: ServiceCategory;
  description: string | null;
  status: 'active' | 'inactive' | 'retired';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  created_by_user?: {
    first_name: string | null;
    last_name: string | null;
  };
  updated_by_user?: {
    first_name: string | null;
    last_name: string | null;
  };
  // Optional aggregate: all-time completed orders count (from service_order_stats view)
  total_order_count?: number;
}

export interface ServiceWithCategory extends PrintingService {
  category: ServiceCategory;
}

export interface ServiceCategoryWithCount {
  category_id: string;
  category_name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  service_count: number;
  services: PrintingService[];
}

// Legacy type for backward compatibility during migration
export interface ServiceItem {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Inactive' | 'Retired';
  category: string;
}

// Helper type for service status
export type ServiceStatus = 'active' | 'inactive' | 'retired';

// Helper type for service filtering
export interface ServiceFilters {
  status?: ServiceStatus[];
  category_id?: string[];
  search?: string;
}
