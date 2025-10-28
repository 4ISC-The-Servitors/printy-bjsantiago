/**
 * Services API module
 * Handles all service-related database operations and realtime subscriptions
 */

import { supabase } from '@lib/supabase';
import type { 
  ServiceCategory, 
  ServiceWithCategory, 
  ServiceCategoryWithCount,
  ServiceFilters 
} from '@shared/types/service';

/**
 * Fetch all services with their categories
 */
export async function fetchAllServices(): Promise<ServiceWithCategory[]> {
  const { data, error } = await supabase
    .from('printing_services')
    .select(`
      *,
      category:service_categories(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all services:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch only active services
 */
export async function fetchActiveServices(): Promise<ServiceWithCategory[]> {
  const { data, error } = await supabase
    .from('printing_services')
    .select(`
      *,
      category:service_categories(*)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active services:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch services grouped by category
 */
export async function fetchServicesByCategory(): Promise<ServiceCategoryWithCount[]> {
  const { data, error } = await supabase
    .from('service_categories')
    .select(`
      *,
      services:printing_services(*)
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching services by category:', error);
    throw error;
  }

  return (data || []).map(category => ({
    ...category,
    service_count: category.services?.length || 0,
    services: category.services || []
  }));
}

/**
 * Fetch active services grouped by category
 */
export async function fetchActiveServicesByCategory(): Promise<ServiceCategoryWithCount[]> {
  const { data, error } = await supabase
    .from('service_categories')
    .select(`
      *,
      services:printing_services!inner(*)
    `)
    .eq('is_active', true)
    .eq('services.status', 'active')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching active services by category:', error);
    throw error;
  }

  return (data || []).map(category => ({
    ...category,
    service_count: category.services?.length || 0,
    services: category.services || []
  }));
}

/**
 * Fetch services with filters
 */
export async function fetchServicesWithFilters(filters: ServiceFilters): Promise<ServiceWithCategory[]> {
  let query = supabase
    .from('printing_services')
    .select(`
      *,
      category:service_categories(*)
    `);

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters.category_id && filters.category_id.length > 0) {
    query = query.in('category_id', filters.category_id);
  }

  if (filters.search) {
    query = query.or(`service_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching filtered services:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<ServiceCategory[]> {
  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data || [];
}

/**
 * Subscribe to services changes for realtime updates
 */
export function subscribeToServices(
  onUpdate: (services: ServiceWithCategory[]) => void
) {
  return supabase
    .channel('printing_services_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'printing_services'
      },
      () => {
        // Refetch data to get the latest state
        fetchAllServices().then(onUpdate).catch(console.error);
      }
    )
    .subscribe();
}

/**
 * Subscribe to active services changes
 */
export function subscribeToActiveServices(
  onUpdate: (services: ServiceWithCategory[]) => void
) {
  return supabase
    .channel('printing_services_active_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'printing_services',
        filter: 'status=eq.active'
      },
      () => {
        fetchActiveServices().then(onUpdate).catch(console.error);
      }
    )
    .subscribe();
}

/**
 * Get service by display ID
 */
export async function fetchServiceByDisplayId(displayId: string): Promise<ServiceWithCategory | null> {
  const { data, error } = await supabase
    .from('printing_services')
    .select(`
      *,
      category:service_categories(*)
    `)
    .eq('display_id', displayId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching service by display ID:', error);
    throw error;
  }

  return data;
}

/**
 * Search services by name or description
 */
export async function searchServices(searchTerm: string): Promise<ServiceWithCategory[]> {
  const { data, error } = await supabase
    .from('printing_services')
    .select(`
      *,
      category:service_categories(*)
    `)
    .or(`service_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order('service_name', { ascending: true });

  if (error) {
    console.error('Error searching services:', error);
    throw error;
  }

  return data || [];
}
