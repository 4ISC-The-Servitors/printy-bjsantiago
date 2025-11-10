import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsivePageLayout from '@customer/components/shared/layouts/ResponsivePageLayout';
import { Text, ToastContainer, Button } from '@shared/components';
import { useToast } from '@lib/useToast';
import { ArrowLeft } from 'lucide-react';
import ProfileOverviewCard from '@/customer/components/accountSettings/ProfileOverviewCard';
import PersonalInfoForm from '@/customer/components/accountSettings/PersonalInfoForm';
import SecuritySettings from '@/customer/components/accountSettings/SecuritySettings';
import { ProfileService } from '@customer/services/profileService';
import { useAuth } from '@auth/hooks/AuthContext';
import { CustomerAccountSettingsLoading } from '@customer/components/loadingStates';

export interface UserData {
  displayName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  province: string;
  region: string;
  barangay: string;
  building: string;
  avatarUrl?: string;
  firstName: string;
  lastName: string;
  customerType: string;
  gender?: string;
  birthday?: string;
}

const AccountSettings: React.FC = () => {
  const [toasts, toast] = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const [isDesktop, setIsDesktop] = useState(false);

  const fetchProfileData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current) {
      return;
    }

    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      // Fetch customer profile from Supabase with timeout
      const profilePromise = ProfileService.getProfile(user.id);
      const profile = (await Promise.race([
        profilePromise,
        timeoutPromise,
      ])) as any;

      if (profile) {
        const displayName = ProfileService.getDisplayName(
          profile.first_name,
          profile.last_name
        );
        const address = ProfileService.formatAddress(profile.address);

        const userDataToSet = {
          displayName,
          email: profile.email_address,
          phone: profile.contact_no,
          address,
          city: profile.address.city_name || '',
          zipCode: profile.address.zip_code
            ? String(profile.address.zip_code).padStart(4, '0')
            : '0000',
          province: profile.address.province_name || '',
          region: profile.address.region_name || '',
          barangay: profile.address.barangay_name || '',
          building: profile.address.building_name || '',
          avatarUrl: '',
          firstName: profile.first_name,
          lastName: profile.last_name,
          customerType: profile.customer_type,
          gender: profile.gender,
          birthday: profile.birthday,
        };

        setUserData(userDataToSet);
      } else {
        // Fallback to empty data if profile not found
        const fallbackData = {
          displayName: '',
          email: user.email || '',
          phone: '',
          address: '',
          city: '',
          zipCode: '',
          province: '',
          region: '',
          barangay: '',
          building: '',
          avatarUrl: '',
          firstName: '',
          lastName: '',
          customerType: '',
          gender: undefined,
          birthday: undefined,
        };
        setUserData(fallbackData);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error(
        'Error',
        `Failed to load profile data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      // Set fallback data even on error
      setUserData({
        displayName: '',
        email: user.email || '',
        phone: '',
        address: '',
        city: '',
        zipCode: '',
        province: '',
        region: '',
        barangay: '',
        building: '',
        avatarUrl: '',
        firstName: '',
        lastName: '',
        customerType: '',
      });
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const initials = useMemo(
    () =>
      (userData?.displayName || '')
        .split(' ')
        .map(n => n[0])
        .join(''),
    [userData?.displayName]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const handleModern = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    const handleLegacy = function (
      this: MediaQueryList,
      e: MediaQueryListEvent
    ) {
      setIsDesktop(e.matches);
    };
    setIsDesktop(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', handleModern);
    else (mql as MediaQueryList).addListener(handleLegacy);
    return () => {
      if (mql.removeEventListener)
        mql.removeEventListener('change', handleModern);
      else (mql as MediaQueryList).removeListener(handleLegacy);
    };
  }, []);

  const handleSavePersonalInfo = async (next: Partial<UserData>) => {
    if (!user?.id) {
      toast.error('Error', 'User not authenticated');
      return;
    }

    try {
      // Convert UserData to ProfileService format
      // Note: email_address is not updatable - it's guarded
      const profileUpdates = {
        contact_no: next.phone,
        address: {
          street_name: next.address, // Street address field contains only street name
          building_name: next.building,
          barangay_name: next.barangay,
          city_name: next.city,
          province_name: next.province,
          region_name: next.region,
          zip_code: next.zipCode,
        },
      };

      const success = await ProfileService.updateProfile(
        user.id,
        profileUpdates
      );

      if (success) {
        // Update local state (excluding email as it's not updatable)
        setUserData(prev => ({ ...(prev as UserData), ...next }));
        toast.success('Saved', 'Your personal information has been updated.');
      } else {
        toast.error('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update profile. Please try again.';

      // Check if it's a duplicate phone error
      if (
        errorMessage.includes('DUPLICATE_PHONE') ||
        errorMessage.includes('already registered')
      ) {
        toast.error(
          'Mobile Number Already Registered',
          'This mobile number is already registered. Please use a different number.'
        );
      } else {
        toast.error('Error', errorMessage);
      }
    }
  };

  return (
    <>
      <ResponsivePageLayout showSidebar={true} maxWidth="xl">
        <div className="mb-6 flex items-center gap-3">
          <Button
            onClick={() => navigate('/customer')}
            variant="secondary"
            size="sm"
            threeD
            className="device-btn-secondary flex items-center justify-center"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <Text
            variant="h1"
            size="xl"
            weight="bold"
            className="device-text-heading"
          >
            Account Settings
          </Text>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {loading ? (
            <CustomerAccountSettingsLoading />
          ) : (
            <>
              {userData && (
                <ProfileOverviewCard
                  initials={initials}
                  displayName={userData.displayName}
                  email={userData.email}
                  membership={
                    userData.customerType === 'valued'
                      ? 'Valued'
                      : userData.customerType === 'regular'
                        ? 'Regular'
                        : 'Valued'
                  }
                />
              )}

              {userData && (
                <PersonalInfoForm
                  value={userData}
                  onSave={handleSavePersonalInfo}
                />
              )}

              <SecuritySettings
                onPasswordUpdated={() =>
                  toast.success(
                    'Password updated',
                    'Your password has been changed successfully.'
                  )
                }
              />
            </>
          )}
        </div>
      </ResponsivePageLayout>

      <ToastContainer
        toasts={toasts}
        onRemoveToast={toast.remove}
        position={isDesktop ? 'bottom-right' : 'top-center'}
      />
    </>
  );
};

export default AccountSettings;
