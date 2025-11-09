import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Container, Text, ToastContainer } from '@shared/components';
import { useToast } from '@lib/useToast';
import ProfileOverviewCard from '@admin/components/accountSettings/ProfileOverviewCard';
import PersonalInfoForm, {
  type AdminUserData,
} from '@admin/components/accountSettings/PersonalInfoForm';
import SecuritySettings from '@admin/components/accountSettings/SecuritySettings';
import CustomerTypeManagement from '@admin/components/accountSettings/CustomerTypeManagement';
import { ProfileService } from '@customer/services/profileService';
import { useAuth } from '@auth/hooks/AuthContext';
import { AdminAccountSettingsLoading } from '@admin/components/loadingStates';

const AdminSettingsPage: React.FC = () => {
  const [toasts, toast] = useToast();
  const { user } = useAuth();

  const [userData, setUserData] = useState<AdminUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const fetchProfileData = useCallback(async () => {
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

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

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
          zipCode: profile.address.zip_code || '',
          province: profile.address.province_name || '',
          barangay: profile.address.barangay_name || '',
          building: profile.address.building_name || '',
          avatarUrl: '',
          firstName: profile.first_name,
          lastName: profile.last_name,
        };

        setUserData(userDataToSet);
      } else {
        const fallbackData = {
          displayName: user.email?.split('@')[0] || 'Admin User',
          email: user.email || '',
          phone: '',
          address: '',
          city: '',
          zipCode: '',
          province: '',
          barangay: '',
          building: '',
          avatarUrl: '',
          firstName: '',
          lastName: '',
        };
        setUserData(fallbackData);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error(
        'Error',
        `Failed to load profile data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      setUserData({
        displayName: user.email?.split('@')[0] || 'Admin User',
        email: user.email || '',
        phone: '',
        address: '',
        city: '',
        zipCode: '',
        province: '',
        barangay: '',
        building: '',
        avatarUrl: '',
        firstName: '',
        lastName: '',
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

  const handleSavePersonalInfo = async (next: Partial<AdminUserData>) => {
    if (!user?.id) {
      toast.error('Error', 'User not authenticated');
      return;
    }

    try {
      const profileUpdates = {
        contact_no: next.phone,
        email_address: next.email,
        address: {
          street_name: next.address,
          building_name: next.building,
          barangay_name: next.barangay,
          city_name: next.city,
          province_name: next.province,
          zip_code: next.zipCode,
        },
      };

      const success = await ProfileService.updateProfile(
        user.id,
        profileUpdates
      );

      if (success) {
        setUserData(prev => ({ ...(prev as AdminUserData), ...next }));
        toast.success('Saved', 'Your personal information has been updated.');
      } else {
        toast.error('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error', 'Failed to update profile. Please try again.');
    }
  };

  return (
    <Container size="xl" className="device-spacing-section">
      <div className="mb-6 flex items-center gap-3">
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
          <AdminAccountSettingsLoading />
        ) : (
          <>
            {userData && (
              <ProfileOverviewCard
                initials={initials}
                displayName={userData.displayName}
                email={userData.email}
                role="Admin"
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

            <CustomerTypeManagement />
          </>
        )}
      </div>

      <ToastContainer
        toasts={toasts}
        onRemoveToast={toast.remove}
        position="bottom-right"
      />
    </Container>
  );
};

export default AdminSettingsPage;
