/**
 * Services API module
 * Handles all service-related database operations and realtime subscriptions
 */

import { supabase } from '@lib/supabase';
import type {
  ServiceCategory,
  ServiceWithCategory,
  ServiceCategoryWithCount,
  ServiceFilters,
} from '@shared/types/service';

let serviceOrderStatsCache: Promise<Record<string, number>> | null = null;

export function invalidateServiceOrderStatsCache(): void {
  serviceOrderStatsCache = null;
}

/**
 * Fetch all services with their categories
 */
export async function fetchAllServices(): Promise<ServiceWithCategory[]> {
  const { data, error } = await supabase
    .from('printing_services')
    .select(
      `
      *,
      category:service_categories(*),
      created_by_user:customer!printing_services_created_by_fkey(first_name, last_name),
      updated_by_user:customer!printing_services_updated_by_fkey(first_name, last_name)
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all services:', error);
    throw error;
  }

  const services = (data || []) as any[];

  // Normalize user data (handle arrays/objects from Supabase)
  const normalizedServices = services.map(s => {
    const createdByUser = Array.isArray(s.created_by_user)
      ? s.created_by_user[0]
      : s.created_by_user;
    const updatedByUser = Array.isArray(s.updated_by_user)
      ? s.updated_by_user[0]
      : s.updated_by_user;

    return {
      ...s,
      created_by_user: createdByUser || null,
      updated_by_user: updatedByUser || null,
    };
  }) as ServiceWithCategory[];

  try {
    const counts = await fetchServiceOrderStats();
    return normalizedServices.map(s => ({
      ...s,
      total_order_count: counts[s.service_id] ?? 0,
    }));
  } catch (e) {
    // If stats fetch fails, return services without counts
    return normalizedServices;
  }
}

/**
 * Fetch only active services
 */
export async function fetchActiveServices(): Promise<ServiceWithCategory[]> {
  const { data, error } = await supabase
    .from('printing_services')
    .select(
      `
      *,
      category:service_categories(*),
      created_by_user:customer!printing_services_created_by_fkey(first_name, last_name),
      updated_by_user:customer!printing_services_updated_by_fkey(first_name, last_name)
    `
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active services:', error);
    throw error;
  }
  const services = (data || []) as any[];

  // Normalize user data (handle arrays/objects from Supabase)
  const normalizedServices = services.map(s => {
    const createdByUser = Array.isArray(s.created_by_user)
      ? s.created_by_user[0]
      : s.created_by_user;
    const updatedByUser = Array.isArray(s.updated_by_user)
      ? s.updated_by_user[0]
      : s.updated_by_user;

    return {
      ...s,
      created_by_user: createdByUser || null,
      updated_by_user: updatedByUser || null,
    };
  }) as ServiceWithCategory[];

  try {
    const counts = await fetchServiceOrderStats();
    return normalizedServices.map(s => ({
      ...s,
      total_order_count: counts[s.service_id] ?? 0,
    }));
  } catch (e) {
    return normalizedServices;
  }
}

/**
 * Fetch services grouped by category
 */
export async function fetchServicesByCategory(): Promise<
  ServiceCategoryWithCount[]
> {
  const { data, error } = await supabase
    .from('service_categories')
    .select(
      `
      *,
      services:printing_services(
        *,
        created_by_user:customer!printing_services_created_by_fkey(first_name, last_name),
        updated_by_user:customer!printing_services_updated_by_fkey(first_name, last_name)
      ),
      created_by_user:customer!service_categories_created_by_fkey(first_name, last_name),
      updated_by_user:customer!service_categories_updated_by_fkey(first_name, last_name)
    `
    )
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching services by category:', error);
    throw error;
  }
  const categories = (data || []) as any[];

  // Normalize user data for categories and services
  const normalizedCategories = categories.map(category => {
    // Normalize category user data
    const categoryCreatedBy = Array.isArray(category.created_by_user)
      ? category.created_by_user[0]
      : category.created_by_user;
    const categoryUpdatedBy = Array.isArray(category.updated_by_user)
      ? category.updated_by_user[0]
      : category.updated_by_user;

    // Normalize service user data
    const services = (category.services || []).map((s: any) => {
      const serviceCreatedBy = Array.isArray(s.created_by_user)
        ? s.created_by_user[0]
        : s.created_by_user;
      const serviceUpdatedBy = Array.isArray(s.updated_by_user)
        ? s.updated_by_user[0]
        : s.updated_by_user;

      return {
        ...s,
        created_by_user: serviceCreatedBy || null,
        updated_by_user: serviceUpdatedBy || null,
      };
    });

    return {
      ...category,
      created_by_user: categoryCreatedBy || null,
      updated_by_user: categoryUpdatedBy || null,
      service_count: services.length,
      services,
    };
  });

  // Attach counts per service
  let counts: Record<string, number> = {};
  try {
    counts = await fetchServiceOrderStats();
  } catch {}

  return normalizedCategories.map(category => ({
    ...category,
    services: category.services.map((s: any) => ({
      ...s,
      total_order_count: counts[s.service_id] ?? 0,
    })),
  }));
}

/**
 * Fetch active services grouped by category
 */
export async function fetchActiveServicesByCategory(): Promise<
  ServiceCategoryWithCount[]
> {
  const { data, error } = await supabase
    .from('service_categories')
    .select(
      `
      *,
      services:printing_services!inner(
        *,
        created_by_user:customer!printing_services_created_by_fkey(first_name, last_name, email_address, customer_id),
        updated_by_user:customer!printing_services_updated_by_fkey(first_name, last_name, email_address, customer_id)
      ),
      created_by_user:customer!service_categories_created_by_fkey(first_name, last_name),
      updated_by_user:customer!service_categories_updated_by_fkey(first_name, last_name)
    `
    )
    .eq('is_active', true)
    .eq('services.status', 'active')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching active services by category:', error);
    throw error;
  }
  const categories = (data || []) as any[];

  // Normalize user data for categories and services
  const normalizedCategories = categories.map(category => {
    // Normalize category user data
    const categoryCreatedBy = Array.isArray(category.created_by_user)
      ? category.created_by_user[0]
      : category.created_by_user;
    const categoryUpdatedBy = Array.isArray(category.updated_by_user)
      ? category.updated_by_user[0]
      : category.updated_by_user;

    // Normalize service user data
    const services = (category.services || []).map((s: any) => {
      const serviceCreatedBy = Array.isArray(s.created_by_user)
        ? s.created_by_user[0]
        : s.created_by_user;
      const serviceUpdatedBy = Array.isArray(s.updated_by_user)
        ? s.updated_by_user[0]
        : s.updated_by_user;

      return {
        ...s,
        created_by_user: serviceCreatedBy || null,
        updated_by_user: serviceUpdatedBy || null,
      };
    });

    return {
      ...category,
      created_by_user: categoryCreatedBy || null,
      updated_by_user: categoryUpdatedBy || null,
      service_count: services.length,
      services,
    };
  });

  let counts: Record<string, number> = {};
  try {
    counts = await fetchServiceOrderStats();
  } catch {}

  return normalizedCategories.map(category => ({
    ...category,
    services: category.services.map((s: any) => ({
      ...s,
      total_order_count: counts[s.service_id] ?? 0,
    })),
  }));
}

/**
 * Fetch services with filters
 */
export async function fetchServicesWithFilters(
  filters: ServiceFilters
): Promise<ServiceWithCategory[]> {
  let query = supabase.from('printing_services').select(`
      *,
      category:service_categories(*),
      created_by_user:customer!printing_services_created_by_fkey(first_name, last_name),
      updated_by_user:customer!printing_services_updated_by_fkey(first_name, last_name)
    `);

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters.category_id && filters.category_id.length > 0) {
    query = query.in('category_id', filters.category_id);
  }

  if (filters.search) {
    query = query.or(
      `service_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching filtered services:', error);
    throw error;
  }

  const services = (data || []) as any[];

  // Normalize user data (handle arrays/objects from Supabase)
  return services.map(s => {
    const createdByUser = Array.isArray(s.created_by_user)
      ? s.created_by_user[0]
      : s.created_by_user;
    const updatedByUser = Array.isArray(s.updated_by_user)
      ? s.updated_by_user[0]
      : s.updated_by_user;

    return {
      ...s,
      created_by_user: createdByUser || null,
      updated_by_user: updatedByUser || null,
    };
  }) as ServiceWithCategory[];
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<ServiceCategory[]> {
  const { data, error } = await supabase
    .from('service_categories')
    .select(
      `
      *,
      created_by_user:customer!service_categories_created_by_fkey(first_name, last_name),
      updated_by_user:customer!service_categories_updated_by_fkey(first_name, last_name)
    `
    )
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  // Normalize user data (handle arrays/objects from Supabase)
  const categories = (data || []) as any[];
  return categories.map(category => {
    const createdByUser = Array.isArray(category.created_by_user)
      ? category.created_by_user[0]
      : category.created_by_user;
    const updatedByUser = Array.isArray(category.updated_by_user)
      ? category.updated_by_user[0]
      : category.updated_by_user;

    return {
      ...category,
      created_by_user: createdByUser || null,
      updated_by_user: updatedByUser || null,
    };
  }) as ServiceCategory[];
}

/**
 * Get active categories (alias for fetchCategories)
 */
export const getActiveCategories = fetchCategories;

/**
 * Get active services for a given category (minimal fields for dropdown)
 */
export async function getActiveServicesByCategory(
  categoryId: string
): Promise<Array<{ display_id: string; service_name: string }>> {
  if (!categoryId) return [];
  const { data, error } = await supabase
    .from('printing_services')
    .select('display_id, service_name')
    .eq('status', 'active')
    .eq('category_id', categoryId)
    .order('display_id', { ascending: true });

  if (error) {
    console.error('Error fetching services by category:', error);
    throw error;
  }
  return data || [];
}

/** Get a single category by id (minimal) */
export async function getCategoryById(
  categoryId: string
): Promise<{ category_id: string; category_name: string } | null> {
  const { data, error } = await supabase
    .from('service_categories')
    .select('category_id, category_name')
    .eq('category_id', categoryId)
    .maybeSingle();
  if (error) {
    console.error('Error fetching category by id:', error);
    return null;
  }
  return (data as any) || null;
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
        table: 'printing_services',
      },
      () => {
        // Refetch data to get the latest state
        fetchAllServices().then(onUpdate).catch(console.error);
      }
    )
    .subscribe();
}

/**
 * Subscribe to service categories changes for realtime updates
 */
export function subscribeToServiceCategories(onUpdate: () => void) {
  return supabase
    .channel('service_categories_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'service_categories',
      },
      () => {
        // Trigger update callback
        onUpdate();
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
        filter: 'status=eq.active',
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
export async function fetchServiceByDisplayId(
  displayId: string
): Promise<ServiceWithCategory | null> {
  const { data, error } = await supabase
    .from('printing_services')
    .select(
      `
      *,
      category:service_categories(*),
      created_by_user:customer!printing_services_created_by_fkey(first_name, last_name),
      updated_by_user:customer!printing_services_updated_by_fkey(first_name, last_name)
    `
    )
    .eq('display_id', displayId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching service by display ID:', error);
    throw error;
  }
  // Normalize user data (handle arrays/objects from Supabase)
  const service = data as any;
  const createdByUser = Array.isArray(service?.created_by_user)
    ? service.created_by_user[0]
    : service?.created_by_user;
  const updatedByUser = Array.isArray(service?.updated_by_user)
    ? service.updated_by_user[0]
    : service?.updated_by_user;

  const normalizedService = {
    ...service,
    created_by_user: createdByUser || null,
    updated_by_user: updatedByUser || null,
  } as ServiceWithCategory;

  // Attach order count if available
  try {
    const counts = await fetchServiceOrderStats();
    return {
      ...normalizedService,
      total_order_count: counts[normalizedService.service_id] ?? 0,
    };
  } catch {
    return normalizedService;
  }
}

/**
 * Search services by name or description
 */
export async function searchServices(
  searchTerm: string
): Promise<ServiceWithCategory[]> {
  const { data, error } = await supabase
    .from('printing_services')
    .select(
      `
      *,
      category:service_categories(*),
      created_by_user:customer!printing_services_created_by_fkey(first_name, last_name),
      updated_by_user:customer!printing_services_updated_by_fkey(first_name, last_name)
    `
    )
    .or(`service_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order('service_name', { ascending: true });

  if (error) {
    console.error('Error searching services:', error);
    throw error;
  }
  const services = (data || []) as any[];

  // Normalize user data (handle arrays/objects from Supabase)
  const normalizedServices = services.map(s => {
    const createdByUser = Array.isArray(s.created_by_user)
      ? s.created_by_user[0]
      : s.created_by_user;
    const updatedByUser = Array.isArray(s.updated_by_user)
      ? s.updated_by_user[0]
      : s.updated_by_user;

    return {
      ...s,
      created_by_user: createdByUser || null,
      updated_by_user: updatedByUser || null,
    };
  }) as ServiceWithCategory[];

  try {
    const counts = await fetchServiceOrderStats();
    return normalizedServices.map(s => ({
      ...s,
      total_order_count: counts[s.service_id] ?? 0,
    }));
  } catch {
    return normalizedServices;
  }
}

/**
 * Fetch per-service completed order counts from the view
 */
async function fetchServiceOrderStatsFromDb(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('service_order_stats')
    .select('service_id,total_order_count');
  if (error) {
    console.error('Error fetching service order stats:', error);
    throw error;
  }
  const result: Record<string, number> = {};
  (data || []).forEach((row: any) => {
    if (row.service_id)
      result[row.service_id] = Number(row.total_order_count) || 0;
  });
  return result;
}

export async function fetchServiceOrderStats(
  options: {
    forceRefresh?: boolean;
    useCache?: boolean;
  } = {}
): Promise<Record<string, number>> {
  const { forceRefresh = false, useCache = true } = options;

  if (!useCache) {
    if (forceRefresh) invalidateServiceOrderStatsCache();
    return fetchServiceOrderStatsFromDb();
  }

  if (!serviceOrderStatsCache || forceRefresh) {
    serviceOrderStatsCache = fetchServiceOrderStatsFromDb().catch(error => {
      serviceOrderStatsCache = null;
      throw error;
    });
  }

  return serviceOrderStatsCache;
}
