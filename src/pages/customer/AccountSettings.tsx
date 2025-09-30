import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPanel from '../../components/customer/shared/sidebar/SidebarPanel';
import LogoutButton from '../../components/customer/shared/sidebar/LogoutButton';
import LogoutModal from '../../components/customer/shared/sidebar/LogoutModal';
import {
  Container,
  Text,
  ToastContainer,
  Button,
} from '../../components/shared/index.ts';
import { useToast } from '../../lib/useToast.ts';
import { ArrowLeft } from 'lucide-react';
import ProfileOverviewCard from '../../components/customer/accountSettings/desktop/ProfileOverviewCard.tsx';
import PersonalInfoForm from '../../components/customer/accountSettings/desktop/PersonalInfoForm.tsx';
import SecuritySettings from '../../components/customer/accountSettings/desktop/SecuritySettings.tsx';
import NotificationPreferences from '../../components/customer/accountSettings/desktop/NotificationPreferences.tsx';
// Use the same conversations hook as Dashboard so the sidebar is consistent
import { useCustomerConversations } from '../../features/chat/customer/hooks/useCustomerConversations';

export interface UserData {
  displayName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  avatarUrl?: string;
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
  const { conversations, activeId } = useCustomerConversations();

  // TODO(BACKEND): Replace local state with data fetched from backend (Supabase)
  // Keep optimistic UI and use skeletons/spinners if needed.
  const [userData, setUserData] = useState<UserData | null>(null);
  const [preferences, setPreferences] =
    useState<NotificationPreferencesData | null>(null);

  const [isDesktop, setIsDesktop] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    // TODO(BACKEND): Fetch profile and preferences for current user
    // Example:
    // const profile = await ProfileService.getProfile();
    // const prefs = await PreferencesService.getPreferences();
    // setUserData(profile);
    // setPreferences(prefs);
    // For now, initialize minimal safe defaults to preserve UX layout
    setUserData({
      displayName: '',
      email: '',
      phone: '+63 9',
      address: '',
      city: '',
      zipCode: '',
      avatarUrl: '',
    });
    setPreferences({
      emailNotifications: true,
      smsNotifications: true,
      orderUpdates: true,
      chatMessages: true,
      ticketUpdates: true,
    });
  }, []);

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

  const handleSavePersonalInfo = (next: Partial<UserData>) => {
    // TODO(BACKEND): Persist profile changes
    setUserData(prev => ({ ...(prev as UserData), ...next }));
    toast.success('Saved', 'Your personal information has been updated.');
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
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
      {/* Sidebar fixed placements */}
      <div className="hidden lg:flex w-64 bg-white border-r border-neutral-200 flex-col">
        <SidebarPanel
          conversations={conversations as any}
          activeId={activeId}
          onSwitchConversation={(id: string) => {
            window.dispatchEvent(new CustomEvent('customer-open-session', { detail: { sessionId: id } }));
            navigate('/customer');
          }}
          onNavigateToAccount={() => navigate('/customer/account')}
          bottomActions={<LogoutButton onClick={() => setShowLogoutModal(true)} />}
        />
      </div>
      <div className="lg:hidden fixed left-0 top-0 bottom-0 w-16 bg-white border-r border-neutral-200 z-50">
        <SidebarPanel
          conversations={conversations as any}
          activeId={activeId}
          onSwitchConversation={(id: string) => {
            window.dispatchEvent(new CustomEvent('customer-open-session', { detail: { sessionId: id } }));
            navigate('/customer');
          }}
          onNavigateToAccount={() => navigate('/customer/account')}
          bottomActions={<LogoutButton onClick={() => setShowLogoutModal(true)} />}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col pl-16 lg:pl-0">
        <Container size="xl" className="py-6 md:py-10">
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
            {userData && (
              <ProfileOverviewCard
                initials={initials}
                displayName={userData.displayName}
                email={userData.email}
                membership="Valued"
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
