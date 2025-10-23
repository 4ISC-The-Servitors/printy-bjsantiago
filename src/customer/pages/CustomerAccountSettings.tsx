import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoutModal from '@customer/components/shared/sidebar/LogoutModal';
import MobileSidebarMenu from '@customer/components/shared/sidebar/MobileSidebarMenu';
import MobileSidebarTrigger from '@customer/components/shared/sidebar/MobileSidebarTrigger';
import {
  Container,
  Text,
  ToastContainer,
  Button,
} from '@shared/components';
import { useToast } from '@lib/useToast';
import { ArrowLeft } from 'lucide-react';
import ProfileOverviewCard from '@/customer/components/accountSettings/ProfileOverviewCard';
import PersonalInfoForm from '@/customer/components/accountSettings/PersonalInfoForm';
import SecuritySettings from '@/customer/components/accountSettings/SecuritySettings';
import NotificationPreferences from '@/customer/components/accountSettings/NotificationPreferences';
import { ProfileService } from '@customer/services/profileService';
import { useAuth } from '@auth/hooks/AuthContext';

export interface UserData {
  displayName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  avatarUrl?: string;
  firstName: string;
  lastName: string;
  customerType: string;
}

export interface NotificationPreferencesData {
  emailNotifications: boolean;
  smsNotifications: boolean;
  orderUpdates: boolean;
  chatMessages: boolean;
  ticketUpdates: boolean;
}

const AccountSettings: React.FC = () => {
  const [toasts, toast] = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [preferences, setPreferences] =
    useState<NotificationPreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const [isDesktop, setIsDesktop] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [navigate]);

  const fetchProfileData = useCallback(async () => {
    console.log('fetchProfileData called, user:', user);
    
    // Prevent multiple simultaneous calls
    if (fetchingRef.current) {
      console.log('Already fetching, skipping...');
      return;
    }
    
    if (!user?.id) {
      console.log('No user ID, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      console.log('Starting to fetch profile data...');
      fetchingRef.current = true;
      setLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      // Fetch customer profile from Supabase with timeout
      const profilePromise = ProfileService.getProfile(user.id);
      const profile = await Promise.race([profilePromise, timeoutPromise]) as any;
      
      console.log('Profile service returned:', profile);
      
      if (profile) {
        const displayName = ProfileService.getDisplayName(profile.first_name, profile.last_name);
        const address = ProfileService.formatAddress(profile.address);
        
        const userDataToSet = {
          displayName,
          email: profile.email_address,
          phone: profile.contact_no,
          address,
          city: profile.address.city_name || '',
          zipCode: profile.address.zip_code || '',
          avatarUrl: '',
          firstName: profile.first_name,
          lastName: profile.last_name,
          customerType: profile.customer_type,
        };
        
        console.log('Setting user data:', userDataToSet);
        setUserData(userDataToSet);
      } else {
        console.log('No profile found, using fallback data');
        // Fallback to empty data if profile not found
        const fallbackData = {
          displayName: '',
          email: user.email || '',
          phone: '',
          address: '',
          city: '',
          zipCode: '',
          avatarUrl: '',
          firstName: '',
          lastName: '',
          customerType: '',
        };
        console.log('Setting fallback user data:', fallbackData);
        setUserData(fallbackData);
      }

      // TODO: Fetch notification preferences from backend
      setPreferences({
        emailNotifications: true,
        smsNotifications: true,
        orderUpdates: true,
        chatMessages: true,
        ticketUpdates: true,
      });
      
      console.log('Profile data fetch completed successfully');
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Error', `Failed to load profile data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Set fallback data even on error
      setUserData({
        displayName: '',
        email: user.email || '',
        phone: '',
        address: '',
        city: '',
        zipCode: '',
        avatarUrl: '',
        firstName: '',
        lastName: '',
        customerType: '',
      });
    } finally {
      console.log('Setting loading to false');
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
      // Update profile in Supabase
      const updateData: any = {};
      if (next.firstName !== undefined) updateData.first_name = next.firstName;
      if (next.lastName !== undefined) updateData.last_name = next.lastName;
      if (next.phone !== undefined) updateData.contact_no = next.phone;
      if (next.email !== undefined) updateData.email_address = next.email;

      const success = await ProfileService.updateProfile(user.id, updateData);
      
      if (success) {
        // Update local state
        setUserData(prev => ({ ...(prev as UserData), ...next }));
        toast.success('Saved', 'Your personal information has been updated.');
      } else {
        toast.error('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleTogglePreference = (key: keyof NotificationPreferencesData) => {
    if (!preferences) return;
    // TODO(BACKEND): Persist preference toggle
    const labelMap: Record<keyof NotificationPreferencesData, string> = {
      emailNotifications: 'email notifications',
      smsNotifications: 'SMS notifications',
      orderUpdates: 'order updates',
      chatMessages: 'chat messages',
      ticketUpdates: 'ticket updates',
    };

    const turnedOn = !preferences[key];
    setPreferences({ ...preferences, [key]: turnedOn });

    if (turnedOn) {
      toast.info('Preference updated', `Turned on ${labelMap[key]}`);
    } else {
      toast.info('Preference updated', `Turned off ${labelMap[key]}`);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex flex-col">
      {/* Mobile header with burger */}
      <div className="lg:hidden flex flex-col">
        <header className="bg-white/80 backdrop-blur border-b border-neutral-200 px-4 py-3 flex items-center justify-between shrink-0">
          <MobileSidebarTrigger onOpen={() => setShowMobileMenu(true)} />
          <div className="w-10" />
        </header>
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowMobileMenu(false)}>
            <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85%] bg-white" onClick={e => e.stopPropagation()}>
              <MobileSidebarMenu
                onClose={() => setShowMobileMenu(false)}
                onViewAllChats={() => { setShowMobileMenu(false); navigate('/customer/chats'); }}
                onAccount={() => setShowMobileMenu(false)}
                onLogout={() => { setShowMobileMenu(false); navigate('/auth/signin'); }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main content - full screen */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Container size="xl" className="py-6 md:py-10 flex-1 overflow-y-auto">
          <div className="mb-6 flex items-center gap-3">
            <Button
              onClick={() => navigate('/customer')}
              variant="secondary"
              size="sm"
              threeD
              className="h-9 w-9 md:h-auto md:w-auto md:px-4 md:py-2 p-0 flex items-center justify-center"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
            <Text variant="h1" size="2xl" weight="bold">
              Account Settings
            </Text>
          </div>

          <div className="space-y-6 md:space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-600"></div>
                <span className="ml-3 text-gray-600">Loading profile...</span>
              </div>
            ) : (
              <>
                {userData && (
                  <ProfileOverviewCard
                    initials={initials}
                    displayName={userData.displayName}
                    email={userData.email}
                    membership={userData.customerType === "valued" ? "Valued" : userData.customerType === "regular" ? "Regular" : "Valued"}
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

                {preferences && (
                  <NotificationPreferences
                    value={preferences}
                    onToggle={handleTogglePreference}
                  />
                )}
              </>
            )}
          </div>
        </Container>

        <ToastContainer
          toasts={toasts}
          onRemoveToast={toast.remove}
          position={isDesktop ? 'bottom-right' : 'top-center'}
        />
      </main>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => navigate('/auth/signin')}
      />
    </div>
  );
};

export default AccountSettings;
