import { supabase } from '@lib/supabase';
import { normalizePhone } from '@/shared/utils/formsFormatter';

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
      // Check for duplicate phone number if phone is being updated
      // Check auth.users table instead of customer table
      if (updates.contact_no !== undefined) {
        // Normalize phone number before checking for duplicates
        const normalizedPhone = normalizePhone(updates.contact_no);
        if (normalizedPhone) {
          // Check for duplicate phone in auth.users (exclude current user)
          // Pass all parameters explicitly to ensure PostgREST matches correctly
          const { data: duplicateCheck, error: phoneCheckError } =
            await supabase.rpc('check_auth_user_duplicates', {
              p_email: null, // Not checking email for profile updates
              p_phone: normalizedPhone,
              p_exclude_user_id: customerId, // Exclude current user
            });

          if (phoneCheckError) {
            console.error('Error checking phone:', phoneCheckError);
            return false;
          }

          if (duplicateCheck?.phone_exists) {
            console.error('Duplicate phone number detected');
            throw new Error(
              'DUPLICATE_PHONE: This mobile number is already registered. Please use a different number.'
            );
          }
        }
      }

      // Update basic customer information
      // Note: email_address is not updatable - it's guarded
      const customerUpdates: any = {};
      if (updates.first_name !== undefined)
        customerUpdates.first_name = updates.first_name;
      if (updates.last_name !== undefined)
        customerUpdates.last_name = updates.last_name;
      if (updates.contact_no !== undefined) {
        // Normalize phone number before saving
        customerUpdates.contact_no = normalizePhone(updates.contact_no);
      }
      // Email is not updatable - removed from updates
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

        // Check if region, province, or city are being updated
        // If so, we need to use upsert_full_address to create/update the full address hierarchy
        const hasLocationHierarchyUpdate =
          addressUpdates.region_name !== undefined ||
          addressUpdates.province_name !== undefined ||
          addressUpdates.city_name !== undefined;

        if (hasLocationHierarchyUpdate) {
          // Use upsert_full_address function to handle region/province/city updates
          // This ensures proper relationships are maintained
          // First, get current address values to fill in any missing fields
          const currentProfile = await ProfileService.getProfile(customerId);
          const currentAddress = currentProfile?.address || {};

          try {
            const { data: locationId, error: rpcError } = await supabase.rpc(
              'upsert_full_address',
              {
                p_region:
                  addressUpdates.region_name ??
                  currentAddress.region_name ??
                  '',
                p_province:
                  addressUpdates.province_name ??
                  currentAddress.province_name ??
                  '',
                p_city:
                  addressUpdates.city_name ?? currentAddress.city_name ?? '',
                p_zip_code:
                  addressUpdates.zip_code ?? currentAddress.zip_code ?? '',
                p_barangay:
                  addressUpdates.barangay_name ??
                  currentAddress.barangay_name ??
                  '',
                p_street:
                  addressUpdates.street_name ??
                  currentAddress.street_name ??
                  '',
                p_building_number: null,
                p_building_name:
                  addressUpdates.building_name ??
                  currentAddress.building_name ??
                  null,
              }
            );

            if (rpcError) {
              console.error('Error calling upsert_full_address:', rpcError);
              return false;
            }

            // Update customer's location_id to the new location
            if (locationId) {
              const { error: customerLocationError } = await supabase
                .from('customer')
                .update({ location_id: locationId })
                .eq('customer_id', customerId);

              if (customerLocationError) {
                console.error(
                  'Error updating customer location_id:',
                  customerLocationError
                );
                return false;
              }
            }
          } catch (error) {
            console.error('Error in upsert_full_address:', error);
            return false;
          }
        } else {
          // Only update existing records if no hierarchy changes
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
      }

      return true;
    } catch (error) {
      console.error('Error in ProfileService.updateProfile:', error);

      // Re-throw duplicate phone errors so they can be handled with specific toast messages
      if (error instanceof Error && error.message.includes('DUPLICATE_PHONE')) {
        throw error;
      }

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
