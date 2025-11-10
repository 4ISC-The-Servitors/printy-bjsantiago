import { supabase } from '@lib/supabase';

export interface CustomerProfile {
  customer_id: string;
  first_name: string;
  last_name: string;
  contact_no: string;
  email_address: string;
  customer_type: string;
  gender?: string;
  birthday?: string;
  address: {
    building_name?: string;
    street_name?: string;
    barangay_name?: string;
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

export class ProfileService {
  /**
   * Get customer profile with full address information
   */
  static async getProfile(customerId: string): Promise<CustomerProfile | null> {
    try {
      // Check if Supabase is available
      if (!supabase) {
        return null;
      }

      // Fetch customer profile with nested address in a single query
      const { data: customerData, error: customerError } = await supabase
        .from('customer')
        .select(
          `
          customer_id,
          first_name,
          last_name,
          contact_no,
          email_address,
          customer_type,
          gender,
          birthday,
          location:location_id (
            location_id,
            zip_code,
            bldg_id,
            building:building (
              bldg_id,
              bldg_name,
              street_id,
              street:street (
                street_id,
                street_name,
                brgy_id,
                barangay:barangay (
                  brgy_id,
                  brgy_name,
                  city:city (
                    city_id,
                    city_name,
                    province:province (
                      province_id,
                      province_name,
                      region:region (
                        region_id,
                        region_name
                      )
                    )
                  )
                )
              )
            )
          )
        `
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
          return null;
        }

        throw new Error(
          `Failed to fetch customer data: ${customerError.message}`
        );
      }

      if (!customerData) {
        return null;
      }

      const location = (customerData as any).location || null;
      const building = location?.building || null;
      const street = building?.street || null;
      const barangay = street?.barangay || null;
      const city = barangay?.city || null;
      const province = city?.province || null;
      const region = province?.region || null;

      const address: CustomerProfile['address'] = {
        building_name: building?.bldg_name ?? '',
        street_name: street?.street_name ?? '',
        barangay_name: barangay?.brgy_name ?? '',
        city_name: city?.city_name ?? '',
        province_name: province?.province_name ?? '',
        region_name: region?.region_name ?? '',
        zip_code: location?.zip_code ?? '',
      };

      const profile = {
        customer_id: customerData.customer_id,
        first_name: customerData.first_name || '',
        last_name: customerData.last_name || '',
        contact_no: customerData.contact_no || '',
        email_address: customerData.email_address || '',
        customer_type: customerData.customer_type || '',
        gender: customerData.gender || undefined,
        birthday: customerData.birthday || undefined,
        address,
      };

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
        return null;
      }

      throw error; // Re-throw other errors
    }
  }

  /**
   * Update customer profile information including address
   */
  static async updateProfile(
    customerId: string,
    updates: UpdateProfileData
  ): Promise<boolean> {
    try {
      // Update basic customer information
      const customerUpdates: any = {};
      if (updates.first_name !== undefined)
        customerUpdates.first_name = updates.first_name;
      if (updates.last_name !== undefined)
        customerUpdates.last_name = updates.last_name;
      if (updates.contact_no !== undefined)
        customerUpdates.contact_no = updates.contact_no;
      if (updates.email_address !== undefined)
        customerUpdates.email_address = updates.email_address;
      if (updates.gender !== undefined) customerUpdates.gender = updates.gender;
      if (updates.birthday !== undefined)
        customerUpdates.birthday = updates.birthday;

      if (Object.keys(customerUpdates).length > 0) {
        const { error: customerError } = await supabase
          .from('customer')
          .update(customerUpdates)
          .eq('customer_id', customerId);

        if (customerError) {
          console.error('Error updating customer profile:', customerError);
          return false;
        }
      }

      // Update address information if provided
      if (updates.address) {
        const addressUpdates = updates.address;

        const { data: locationDetails, error: locationDetailsError } =
          await supabase
            .from('customer')
            .select(
              `
              location:location_id (
                location_id,
                bldg_id,
                building:building (
                  bldg_id,
                  street_id,
                  street:street (
                    street_id,
                    brgy_id,
                    barangay:barangay (
                      brgy_id
                    )
                  )
                )
              )
            `
            )
            .eq('customer_id', customerId)
            .maybeSingle();

        if (locationDetailsError) {
          console.error(
            'Error fetching customer location details:',
            locationDetailsError
          );
          return false;
        }

        const location = Array.isArray(locationDetails?.location)
          ? locationDetails.location[0]
          : locationDetails?.location;

        if (!location) {
          console.error('No location record found for customer:', customerId);
          return false;
        }

        const locationId: string | undefined = (location as any).location_id;
        const buildingId: string | undefined =
          (location as any).bldg_id || (location as any).building?.bldg_id;
        const streetId: string | undefined =
          (location as any).building?.street_id ||
          (location as any).building?.street?.street_id;
        const barangayId: string | undefined =
          (location as any).building?.street?.brgy_id ||
          (location as any).building?.street?.barangay?.brgy_id;

        if (addressUpdates.zip_code !== undefined && locationId) {
          const { error: locationError } = await supabase
            .from('location')
            .update({ zip_code: addressUpdates.zip_code })
            .eq('location_id', locationId);

          if (locationError) {
            console.error('Error updating location:', locationError);
            return false;
          }
        }

        if (addressUpdates.building_name !== undefined && buildingId) {
          const { error: buildingError } = await supabase
            .from('building')
            .update({ bldg_name: addressUpdates.building_name })
            .eq('bldg_id', buildingId);

          if (buildingError) {
            console.error('Error updating building:', buildingError);
            return false;
          }
        }

        if (addressUpdates.street_name !== undefined && streetId) {
          const { error: streetError } = await supabase
            .from('street')
            .update({ street_name: addressUpdates.street_name })
            .eq('street_id', streetId);

          if (streetError) {
            console.error('Error updating street:', streetError);
            return false;
          }
        }

        if (addressUpdates.barangay_name !== undefined && barangayId) {
          const { error: barangayError } = await supabase
            .from('barangay')
            .update({ brgy_name: addressUpdates.barangay_name })
            .eq('brgy_id', barangayId);

          if (barangayError) {
            console.error('Error updating barangay:', barangayError);
            return false;
          }
        }
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

    // Only include street name for street address
    if (address.street_name) {
      parts.push(address.street_name);
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
