import React, { useMemo, useState } from 'react';
import { Container, Text, ToastContainer } from '../../../components/shared';
import { useToast } from '../../../lib/useToast';
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

  const initials = useMemo(
    () =>
      userData.displayName
        .split(' ')
        .map(n => n[0])
        .join(''),
    [userData.displayName]
  );

  const handleSavePersonalInfo = (next: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...next }));
    toast.success('Saved', 'Your personal information has been updated!');
  };

  const handleTogglePreference = (key: keyof NotificationPreferencesData) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    toast.info('Preference updated', `Toggled ${String(key)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50">
      <Container size="xl" className="py-6 md:py-10">
        <div className="mb-6 text-center">
          <Text variant="h1" size="2xl" weight="bold" align="center">
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

          <SecuritySettings />

          <NotificationPreferences
            value={preferences}
            onToggle={handleTogglePreference}
          />
        </div>
      </Container>

      <ToastContainer
        toasts={toasts}
        onRemoveToast={toast.remove}
        position="top-center"
      />
    </div>
  );
};

export default AccountSettingsPage;
