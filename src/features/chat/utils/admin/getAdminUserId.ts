import { supabase } from '@lib/supabase';

/**
 * Get the admin user ID from the customer table
 * Used by admin actions to track who made changes for notification routing
 * Returns the first admin user found (there may be multiple admins)
 */
export async function getAdminUserId(): Promise<string> {
  const { data: adminData, error: adminError } = await supabase
    .from('customer')
    .select('customer_id')
    .eq('customer_type', 'admin')
    .limit(1)
    .single();

  if (adminError || !adminData) {
    console.error('[getAdminUserId] Error fetching admin user:', adminError);
    throw new Error('Failed to verify admin credentials');
  }

  return adminData.customer_id;
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
