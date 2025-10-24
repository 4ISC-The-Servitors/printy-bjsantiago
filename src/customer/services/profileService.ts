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
          'customer_id, first_name, last_name, contact_no, email_address, customer_type, gender, birthday, location_id'
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
        street_name: '',
        barangay_name: '',
        city_name: '',
        province_name: '',
        region_name: '',
        zip_code: '',
      };

      if (customerData.location_id) {
        try {
          // Use Supabase nested selects to traverse relations from location
          const { data: joined, error: joinedError } = await supabase
            .from('location')
            .select(
              `
              zip_code,
              building!inner (
                bldg_name,
                street_id,
                street!inner (
                  street_name,
                  brgy_id,
                  barangay!inner (
                    brgy_name,
                    city_id,
                    city!inner (
                      city_name,
                      province_id,
                      province!inner (
                        province_name,
                        region_id,
                        region!inner (region_name)
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

            // Get building, street and nested data
            const building = j?.building ?? null;
            const street = building?.street ?? null;
            const barangay = street?.barangay ?? null;
            const city = barangay?.city ?? null;
            const province = city?.province ?? null;
            const region = province?.region ?? null;

            address = {
              building_name: building?.bldg_name ?? '',
              street_name: street?.street_name ?? '',
              barangay_name: barangay?.brgy_name ?? '',
              city_name: city?.city_name ?? '',
              province_name: province?.province_name ?? '',
              region_name: region?.region_name ?? '',
              zip_code: j?.zip_code ?? '',
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
        gender: customerData.gender || undefined,
        birthday: customerData.birthday || undefined,
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
        // Get current location_id
        const { data: customerData, error: customerError } = await supabase
          .from('customer')
          .select('location_id')
          .eq('customer_id', customerId)
          .single();

        if (customerError) {
          console.error('Error fetching customer location:', customerError);
          return false;
        }

        if (customerData?.location_id) {
          // Update location table with zip_code only (building details are in building table)
          const locationUpdates: any = {};
          if (updates.address.zip_code !== undefined)
            locationUpdates.zip_code = updates.address.zip_code;

          if (Object.keys(locationUpdates).length > 0) {
            const { error: locationError } = await supabase
              .from('location')
              .update(locationUpdates)
              .eq('location_id', customerData.location_id);

            if (locationError) {
              console.error('Error updating location:', locationError);
              return false;
            }
          }

          // Update building information if provided
          if (updates.address.building_name !== undefined) {
            // Get the bldg_id from location
            const { data: locationData, error: locationError } = await supabase
              .from('location')
              .select('bldg_id')
              .eq('location_id', customerData.location_id)
              .single();

            if (!locationError && locationData?.bldg_id) {
              const buildingUpdates: any = {};
              if (updates.address.building_name !== undefined)
                buildingUpdates.bldg_name = updates.address.building_name;

              if (Object.keys(buildingUpdates).length > 0) {
                const { error: buildingError } = await supabase
                  .from('building')
                  .update(buildingUpdates)
                  .eq('bldg_id', locationData.bldg_id);

                if (buildingError) {
                  console.error('Error updating building:', buildingError);
                  return false;
                }
              }
            }
          }

          // Update street information if street_name is provided
          if (updates.address.street_name !== undefined) {
            // Get the bldg_id from location, then street_id from building
            const { data: locationData, error: locationError } = await supabase
              .from('location')
              .select('bldg_id')
              .eq('location_id', customerData.location_id)
              .single();

            if (!locationError && locationData?.bldg_id) {
              const { data: buildingData, error: buildingError } =
                await supabase
                  .from('building')
                  .select('street_id')
                  .eq('bldg_id', locationData.bldg_id)
                  .single();

              if (!buildingError && buildingData?.street_id) {
                // Update street name
                const { error: streetError } = await supabase
                  .from('street')
                  .update({ street_name: updates.address.street_name })
                  .eq('street_id', buildingData.street_id);

                if (streetError) {
                  console.error('Error updating street:', streetError);
                  return false;
                }
              }
            }
          }

          // Update barangay information if barangay_name is provided
          if (updates.address.barangay_name !== undefined) {
            // Get the bldg_id from location, then street_id from building, then barangay_id from street
            const { data: locationData, error: locationError } = await supabase
              .from('location')
              .select('bldg_id')
              .eq('location_id', customerData.location_id)
              .single();

            if (!locationError && locationData?.bldg_id) {
              const { data: buildingData, error: buildingError } =
                await supabase
                  .from('building')
                  .select('street_id')
                  .eq('bldg_id', locationData.bldg_id)
                  .single();

              if (!buildingError && buildingData?.street_id) {
                const { data: streetData, error: streetError } = await supabase
                  .from('street')
                  .select('brgy_id')
                  .eq('street_id', buildingData.street_id)
                  .single();

                if (!streetError && streetData?.brgy_id) {
                  // Update barangay name
                  const { error: barangayError } = await supabase
                    .from('barangay')
                    .update({ brgy_name: updates.address.barangay_name })
                    .eq('brgy_id', streetData.brgy_id);

                  if (barangayError) {
                    console.error('Error updating barangay:', barangayError);
                    return false;
                  }
                }
              }
            }
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
