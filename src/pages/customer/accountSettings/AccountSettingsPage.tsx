import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Text,
  ToastContainer,
  Button,
} from '../../../components/shared';
import { useToast } from '../../../lib/useToast';
import { ArrowLeft } from 'lucide-react';
import ProfileOverviewCard from '../../../components/customer/accountSettings/ProfileOverviewCard.tsx';
import PersonalInfoForm from '../../../components/customer/accountSettings/PersonalInfoForm.tsx';
import SecuritySettings from '../../../components/customer/accountSettings/SecuritySettings.tsx';
import NotificationPreferences from '../../../components/customer/accountSettings/NotificationPreferences.tsx';

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

const AccountSettingsPage: React.FC = () => {
  const [toasts, toast] = useToast();
  const navigate = useNavigate();

  const [userData, setUserData] = useState<UserData>({
    displayName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+63 (917) 123-4567',
    address: '123 Rizal Street',
    city: 'Manila',
    zipCode: '1000',
    avatarUrl: '',
  });

  const [preferences, setPreferences] = useState<NotificationPreferencesData>({
    emailNotifications: true,
    smsNotifications: true,
    orderUpdates: true,
    chatMessages: true,
    ticketUpdates: true,
  });

  const [isDesktop, setIsDesktop] = useState(false);

  const initials = useMemo(
    () =>
      userData.displayName
        .split(' ')
        .map(n => n[0])
        .join(''),
    [userData.displayName]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop('matches' in e ? e.matches : (e as MediaQueryList).matches);
    };
    // Initialize
    setIsDesktop(mql.matches);
    // Subscribe to changes
    if (mql.addEventListener) {
      mql.addEventListener(
        'change',
        handleChange as (ev: MediaQueryListEvent) => void
      );
    } else if ((mql as any).addListener) {
      (mql as any).addListener(handleChange as any);
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener(
          'change',
          handleChange as (ev: MediaQueryListEvent) => void
        );
      } else if ((mql as any).removeListener) {
        (mql as any).removeListener(handleChange as any);
      }
    };
  }, []);

  const handleSavePersonalInfo = (next: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...next }));
    toast.success('Saved', 'Your personal information has been updated.');
  };

  const handleTogglePreference = (key: keyof NotificationPreferencesData) => {
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50">
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
          <ProfileOverviewCard
            initials={initials}
            displayName={userData.displayName}
            email={userData.email}
            membership="Valued"
          />

          <PersonalInfoForm value={userData} onSave={handleSavePersonalInfo} />

          <SecuritySettings
            onPasswordUpdated={() =>
              toast.success(
                'Password updated',
                'Your password has been changed successfully.'
              )
            }
          />

          <NotificationPreferences
            value={preferences}
            onToggle={handleTogglePreference}
          />
        </div>
      </Container>

      <ToastContainer
        toasts={toasts}
        onRemoveToast={toast.remove}
        position={isDesktop ? 'bottom-right' : 'top-center'}
      />
    </div>
  );
};

export default AccountSettingsPage;
