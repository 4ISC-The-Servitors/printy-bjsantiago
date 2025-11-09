import { supabase } from '@lib/supabase';
import { auth } from '@lib/supabase';

export interface CustomerSearchResult {
  customer_id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  contact_no: string;
  customer_type: string;
}

export interface CustomerDetails extends CustomerSearchResult {
  gender?: string;
  birthday?: string;
  address?: {
    building_name?: string;
    street_name?: string;
    barangay_name?: string;
    city_name?: string;
    province_name?: string;
    region_name?: string;
    zip_code?: string;
  };
}

/**
 * Admin Customer Service
 * Provides functionality for admins to manage customer data
 */
export class CustomerService {
  /**
   * Search for customers by email, name, or customer_id
   * @param query - Search query (email, name, or customer_id)
   * @returns Array of matching customers
   */
  static async searchCustomers(query: string): Promise<CustomerSearchResult[]> {
    try {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        return [];
      }

      // Try to match by customer_id (UUID) first
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          trimmedQuery
        );

      if (isUUID) {
        const { data, error } = await supabase
          .from('customer')
          .select(
            'customer_id, first_name, last_name, email_address, contact_no, customer_type'
          )
          .eq('customer_id', trimmedQuery)
          .limit(10);

        if (error) {
          console.error('Error searching customers by ID:', error);
          return [];
        }

        return data || [];
      }

      // Search by email or name
      const { data, error } = await supabase
        .from('customer')
        .select(
          'customer_id, first_name, last_name, email_address, contact_no, customer_type'
        )
        .or(
          `email_address.ilike.%${trimmedQuery}%,first_name.ilike.%${trimmedQuery}%,last_name.ilike.%${trimmedQuery}%`
        )
        .limit(10);

      if (error) {
        console.error('Error searching customers:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchCustomers:', error);
      return [];
    }
  }

  /**
   * Get customer details by customer_id
   * @param customerId - Customer UUID
   * @returns Customer details or null if not found
   */
  static async getCustomerById(
    customerId: string
  ): Promise<CustomerDetails | null> {
    try {
      const { data, error } = await supabase
        .from('customer')
        .select(
          'customer_id, first_name, last_name, email_address, contact_no, customer_type, gender, birthday'
        )
        .eq('customer_id', customerId)
        .single();

      if (error) {
        console.error('Error fetching customer:', error);
        return null;
      }

      if (!data) {
        console.error('No customer data returned');
        return null;
      }

      // Address is optional and not needed for customer type management
      // We can fetch it later if needed, but for now we'll skip it to avoid query complexity

      // Normalize customer_type: handle null, empty string, or whitespace
      const customerType = data.customer_type
        ? String(data.customer_type).trim().toLowerCase()
        : 'regular';

      // Validate customer_type is either 'regular' or 'valued', default to 'regular' if invalid
      const normalizedCustomerType =
        customerType === 'valued' || customerType === 'regular'
          ? customerType
          : 'regular';

      return {
        customer_id: data.customer_id,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email_address: data.email_address || '',
        contact_no: data.contact_no || '',
        customer_type: normalizedCustomerType,
        gender: data.gender || undefined,
        birthday: data.birthday || undefined,
        address: undefined, // Not needed for customer type management
      };
    } catch (error) {
      console.error('Error in getCustomerById:', error);
      return null;
    }
  }

  /**
   * Update customer type (one-way: regular to valued only)
   * @param customerId - Customer UUID
   * @param customerType - New customer type ('regular' or 'valued')
   * @returns Success status
   * @note Changes are one-way only: regular customers can be upgraded to valued, but valued customers cannot be downgraded to regular.
   */
  static async updateCustomerType(
    customerId: string,
    customerType: 'regular' | 'valued'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate customer type
      if (customerType !== 'regular' && customerType !== 'valued') {
        return {
          success: false,
          error: 'Invalid customer type. Must be "regular" or "valued".',
        };
      }

      // Verify current user is authenticated and is an admin
      const { data: userData, error: userError } = await auth.getUser();
      if (userError || !userData?.user) {
        return {
          success: false,
          error: 'User not authenticated.',
        };
      }

      const currentUserId = userData.user.id;

      // Check if current user is admin by checking customer table
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('customer')
        .select('customer_type')
        .eq('customer_id', currentUserId)
        .single();

      if (adminCheckError || !adminCheck) {
        console.error('Error checking admin status:', adminCheckError);
        return {
          success: false,
          error: 'Unable to verify admin permissions.',
        };
      }

      const userRole = (adminCheck.customer_type as string)?.toLowerCase();
      const isAdmin = userRole === 'admin';

      if (!isAdmin) {
        return {
          success: false,
          error:
            'Only admins can update customer types. Superadmins are not allowed to perform this action.',
        };
      }

      // Check current customer type to enforce one-way change (regular to valued only)
      const { data: customerData, error: customerFetchError } = await supabase
        .from('customer')
        .select('customer_type')
        .eq('customer_id', customerId)
        .single();

      if (customerFetchError || !customerData) {
        console.error('Error fetching customer:', customerFetchError);
        return {
          success: false,
          error: 'Customer not found.',
        };
      }

      const currentCustomerType = (customerData.customer_type as string)
        ?.toLowerCase()
        .trim();

      // Enforce one-way change: only allow changing from regular to valued
      if (currentCustomerType === 'valued' && customerType === 'regular') {
        return {
          success: false,
          error:
            'Cannot change customer type from valued to regular. Changes are one-way only (regular to valued).',
        };
      }

      // If customer is already the target type, return success without updating
      if (currentCustomerType === customerType) {
        return {
          success: true,
        };
      }

      // Perform the update
      const { data, error } = await supabase
        .from('customer')
        .update({ customer_type: customerType })
        .eq('customer_id', customerId)
        .select();

      if (error) {
        console.error('Error updating customer type:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        return {
          success: false,
          error: error.message || 'Failed to update customer type.',
        };
      }

      // Verify the update actually happened
      if (!data || data.length === 0) {
        console.warn(
          'Update returned no data - customer may not exist or update was blocked by RLS'
        );

        return {
          success: false,
          error:
            'Update was blocked. The customer may not exist, or you may not have permission to update this customer. Please check your admin permissions.',
        };
      }

      // Verify the customer_type was actually updated
      const updatedType = data[0]?.customer_type;
      if (updatedType !== customerType) {
        console.error('Customer type mismatch:', {
          expected: customerType,
          actual: updatedType,
        });
        return {
          success: false,
          error: `Update completed but customer type is "${updatedType}" instead of "${customerType}".`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateCustomerType:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update customer type.',
      };
    }
  }
}
