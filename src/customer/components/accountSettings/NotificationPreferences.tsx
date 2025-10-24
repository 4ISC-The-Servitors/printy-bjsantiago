import React from 'react';
import { Card, Text, Switch } from '@shared/components';
import type { NotificationPreferencesData } from '@customer/pages/CustomerAccountSettings';

interface NotificationPreferencesProps {
  value: NotificationPreferencesData;
  onToggle: (key: keyof NotificationPreferencesData) => void;
}

const ResponsiveSwitch: React.FC<{
  checked: boolean;
  onClick: () => void;
  label: string;
}> = ({ checked, onClick, label }) => (
  <Switch
    size="responsive"
    checked={checked}
    onCheckedChange={() => onClick()}
    label={label}
  />
);

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  value,
  onToggle,
}) => {
  return (
    <Card className="p-4 md:p-6">
      <Text variant="h3" className="device-text-heading mb-4" weight="semibold">
        Notification Preferences
      </Text>
      <Text variant="p" className="device-text-body text-neutral-600 mb-6">
        Choose how you want to be notified about account activity
      </Text>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Text variant="span" className="device-text-body" weight="medium">
              Email Notifications
            </Text>
            <Text variant="p" className="device-text-caption text-neutral-600">
              Receive notifications via email
            </Text>
          </div>
          <ResponsiveSwitch
            checked={value.emailNotifications}
            onClick={() => onToggle('emailNotifications')}
            label="Email Notifications"
          />
        </div>
      </div>
    </Card>
  );
};

export default NotificationPreferences;
