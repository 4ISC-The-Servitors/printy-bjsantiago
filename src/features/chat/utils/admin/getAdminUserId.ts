import { supabase } from '@lib/supabase';

/**
 * Get the CURRENT authenticated admin user ID from the customer table.
 * This must reflect the actor who triggered the action so DB triggers
 * can attribute and exclude them correctly for notifications.
 */
export async function getAdminUserId(): Promise<string> {
  // Get current authenticated user (auth.users.id)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    console.error('[getAdminUserId] Error fetching current auth user:', authError);
    throw new Error('Not authenticated');
  }

  // Verify this auth user is an admin in public.customer and return the same UUID
  const { data, error } = await supabase
    .from('customer')
    .select('customer_id, customer_type')
    .eq('customer_id', user.id)
    .single();

  if (error || !data) {
    console.error('[getAdminUserId] Error fetching customer record for current user:', error);
    throw new Error('Failed to resolve current user');
  }

  if (data.customer_type !== 'admin') {
    console.error('[getAdminUserId] Current user is not an admin');
    throw new Error('Forbidden: user is not an admin');
  }

  return data.customer_id;
}

/**
 * Get all admin user IDs from the customer table
 * Used for creating notifications to all admins
 */
export async function getAllAdminIds(): Promise<string[]> {
  // Use RPC function to bypass RLS (same as working quote actions)
  const { data: admins, error: adminError } = await supabase.rpc(
    'get_admin_customer_ids'
  );

  if (adminError || !admins) {
    console.error('[getAllAdminIds] Error fetching admin users:', adminError);
    throw new Error('Failed to fetch admin users');
  }

  const adminIds = admins.map(
    (admin: { customer_id: string }) => admin.customer_id
  );

  return adminIds;
}

/**
 * Get admin user information by customer_id
 * Returns admin's first_name and last_name for display purposes
 * Uses RPC function to bypass RLS, allowing customers to see admin names in conversations
 */
export async function getAdminUserInfo(
  adminId: string
): Promise<{ first_name: string; last_name: string; fullName: string } | null> {
  try {
    // Use RPC function to bypass RLS - this allows customers to see admin names
    const { data: adminData, error: adminError } = await supabase.rpc(
      'get_admin_name_by_id',
      { p_admin_id: adminId }
    );

    if (adminError || !adminData) {
      console.error('[getAdminUserInfo] Error fetching admin user:', adminError);
      return null;
    }

    return {
      first_name: (adminData as any).first_name || '',
      last_name: (adminData as any).last_name || '',
      fullName: (adminData as any).fullName || 'Admin',
    };
  } catch (error) {
    console.error('[getAdminUserInfo] Unexpected error:', error);
    return null;
  }
}

/**
 * Get admin user information for multiple admin IDs
 * Useful for batch fetching admin names when displaying multiple messages
 * Uses RPC function to bypass RLS, allowing customers to see admin names in conversations
 */
export async function getAdminUserInfoBatch(
  adminIds: string[]
): Promise<Map<string, { first_name: string; last_name: string; fullName: string }>> {
  const adminInfoMap = new Map<
    string,
    { first_name: string; last_name: string; fullName: string }
  >();

  if (adminIds.length === 0) {
    return adminInfoMap;
  }

  try {
    // Use RPC function to bypass RLS - this allows customers to see admin names
    const { data: adminData, error: adminError } = await supabase.rpc(
      'get_admin_names_batch',
      { p_admin_ids: adminIds }
    );

    if (adminError) {
      // If function doesn't exist yet (PostgREST cache not refreshed), log and return empty map
      // This will cause messages to show "Admin" instead of admin names until cache refreshes
      if (adminError.code === 'PGRST202') {
        console.warn(
          '[getAdminUserInfoBatch] Function not found in schema cache. PostgREST needs to refresh. ' +
          'Run migration 033_reload_postgrest_cache_admin_functions.sql and wait 2-5 minutes.'
        );
      } else {
        console.error('[getAdminUserInfoBatch] Error fetching admin users:', adminError);
      }
      return adminInfoMap;
    }

    if (!adminData) {
      return adminInfoMap;
    }

    // RPC returns JSON object keyed by admin ID
    // Convert to Map for easier lookup
    if (typeof adminData === 'object' && adminData !== null) {
      for (const adminId of adminIds) {
        const adminInfo = (adminData as any)[adminId];
        if (adminInfo) {
          adminInfoMap.set(adminId, {
            first_name: adminInfo.first_name || '',
            last_name: adminInfo.last_name || '',
            fullName: adminInfo.fullName || 'Admin',
          });
        }
      }
    }
  } catch (error) {
    console.error('[getAdminUserInfoBatch] Unexpected error:', error);
  }

  return adminInfoMap;
}
