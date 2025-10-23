import { supabase } from '@lib/supabase';

export interface CustomerProfile {
  customer_id: string;
  first_name: string;
  last_name: string;
  contact_no: string;
  email_address: string;
  customer_type: string;
  address: {
    building_name?: string;
    building_number?: string;
    street_name?: string;
    street_number?: string;
    barangay_name?: string;
    barangay_number?: string;
    city_name?: string;
    province_name?: string;
    region_name?: string;
    zip_code?: string;
  };
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  contact_no?: string;
  email_address?: string;
}

export class ProfileService {
  /**
   * Get customer profile with full address information
   */
  static async getProfile(customerId: string): Promise<CustomerProfile | null> {
    try {
      console.log('Fetching profile for customer ID:', customerId);

      // Check if Supabase is available
      if (!supabase) {
        console.warn('Supabase client not available, returning null');
        return null;
      }

      // Simple query to get basic customer data first
      const { data: customerData, error: customerError } = await supabase
        .from('customer')
        .select(
          'customer_id, first_name, last_name, contact_no, email_address, customer_type, location_id'
        )
        .eq('customer_id', customerId)
        .maybeSingle();

      if (customerError) {
        console.error('Error fetching customer data:', customerError);

        // Check if it's a network error
        if (
          customerError.message.includes('Failed to fetch') ||
          customerError.message.includes('NetworkError') ||
          customerError.message.includes('TypeError')
        ) {
          console.warn(
            'Network error detected, returning null to allow fallback'
          );
          return null;
        }

        throw new Error(
          `Failed to fetch customer data: ${customerError.message}`
        );
      }

      if (!customerData) {
        console.log('No customer data found for ID:', customerId);
        return null;
      }

      console.log('Customer data fetched successfully:', customerData);

      // Fetch address parts by joining related tables from location
      let address: CustomerProfile['address'] = {
        building_name: '',
        building_number: '',
        street_name: '',
        street_number: '',
        barangay_name: '',
        barangay_number: '',
        city_name: '',
        province_name: '',
        region_name: '',
        zip_code: '',
      };

      if (customerData.location_id) {
        try {
          // Use Supabase nested selects to traverse relations
          const { data: joined, error: joinedError } = await supabase
            .from('location')
            .select(
              `
              bldg_name,
              bldg_num,
              zip_code,
              zipcode:zip_id (
                zip_code,
                city:city_id (
                  city_name,
                  province:province_id (
                    province_name,
                    region:region_id (region_name)
                  )
                )
              ),
              building:bldg_id (
                bldg_name,
                bldg_num,
                street:street_id (
                  street_name,
                  street_num,
                  barangay:brgy_id (
                    brgy_name,
                    brgy_num,
                    city:city_id (
                      city_name,
                      province:province_id (
                        province_name,
                        region:region_id (region_name)
                      )
                    )
                  )
                )
              )
            `
            )
            .eq('location_id', customerData.location_id)
            .maybeSingle();

          if (!joinedError && joined) {
            const j: any = joined as any;

            // Prefer normalized building values; fallback to location's own fields
            const building = j?.building ?? null;
            const street = building?.street ?? null;
            const barangay = street?.barangay ?? null;

            // City and province/region can come either from barangay->city or zipcode->city
            const cityFromBarangay = barangay?.city ?? null;
            const cityFromZip = j?.zipcode?.city ?? null;
            const city = cityFromBarangay || cityFromZip;
            const province = city?.province ?? null;
            const region = province?.region ?? null;

            address = {
              building_name: building?.bldg_name ?? j?.bldg_name ?? '',
              building_number: building?.bldg_num ?? j?.bldg_num ?? '',
              street_name: street?.street_name ?? '',
              street_number: street?.street_num ?? '',
              barangay_name: barangay?.brgy_name ?? '',
              barangay_number: barangay?.brgy_num ?? '',
              city_name: city?.city_name ?? '',
              province_name: province?.province_name ?? '',
              region_name: region?.region_name ?? '',
              // Prefer explicit location.zip_code then zipcode.zip_code
              zip_code:
                (j?.zip_code ?? j?.zipcode?.zip_code ?? '')?.toString?.() ?? '',
            };
          }
        } catch (e) {
          console.warn('Failed to fetch joined address data', e);
        }
      }

      const profile = {
        customer_id: customerData.customer_id,
        first_name: customerData.first_name || '',
        last_name: customerData.last_name || '',
        contact_no: customerData.contact_no || '',
        email_address: customerData.email_address || '',
        customer_type: customerData.customer_type || '',
        address,
      };

      console.log('Profile created successfully:', profile);
      return profile;
    } catch (error) {
      console.error('Error in ProfileService.getProfile:', error);

      // Check if it's a network error
      if (
        error instanceof Error &&
        (error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('TypeError'))
      ) {
        console.warn(
          'Network error detected, returning null to allow fallback'
        );
        return null;
      }

      throw error; // Re-throw other errors
    }
  }

  /**
   * Update customer profile information
   */
  static async updateProfile(
    customerId: string,
    updates: UpdateProfileData
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customer')
        .update(updates)
        .eq('customer_id', customerId);

      if (error) {
        console.error('Error updating customer profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in ProfileService.updateProfile:', error);
      return false;
    }
  }

  /**
   * Format address for display
   */
  static formatAddress(address: CustomerProfile['address']): string {
    const parts = [];

    if (address.building_number) {
      parts.push(address.building_number);
    }
    if (address.building_name) {
      parts.push(address.building_name);
    }
    if (address.street_name) {
      parts.push(address.street_name);
    }
    if (address.barangay_name) {
      parts.push(`Brgy. ${address.barangay_name}`);
    }
    if (address.city_name) {
      parts.push(address.city_name);
    }
    if (address.province_name) {
      parts.push(address.province_name);
    }
    if (address.zip_code) {
      parts.push(address.zip_code);
    }

    return parts.join(', ');
  }

  /**
   * Get display name from first and last name
   */
  static getDisplayName(firstName: string, lastName: string): string {
    const first = firstName?.trim() || '';
    const last = lastName?.trim() || '';
    return `${first} ${last}`.trim();
  }
}
