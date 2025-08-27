import React from 'react';
import { Card, Text, Button } from '../../shared';
import type { NotificationPreferencesData } from '../../../pages/customer/accountSettings/AccountSettingsPage';

interface NotificationPreferencesProps {
  value: NotificationPreferencesData;
  onToggle: (key: keyof NotificationPreferencesData) => void;
}

const Switch: React.FC<{ checked: boolean; onClick: () => void; label: string }> = ({ checked, onClick, label }) => (
  <Button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onClick}
    variant={checked ? 'primary' : 'ghost'}
    className={`relative inline-flex h-6 w-11 items-center rounded-full ${checked ? '' : 'border border-neutral-300'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </Button>
);

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ value, onToggle }) => {
  return (
    <Card className="p-4 md:p-6">
      <Text variant="h3" size="lg" weight="semibold" className="mb-4">Notification Preferences</Text>
      <Text variant="p" className="text-neutral-600 mb-6">Choose how you want to be notified about account activity</Text>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Text variant="span" weight="medium">Email Notifications</Text>
            <Text variant="p" className="text-neutral-600">Receive notifications via email</Text>
          </div>
          <Switch checked={value.emailNotifications} onClick={() => onToggle('emailNotifications')} label="Email Notifications" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Text variant="span" weight="medium">Order Updates</Text>
            <Text variant="p" className="text-neutral-600">Get notified about order status changes</Text>
          </div>
          <Switch checked={value.orderUpdates} onClick={() => onToggle('orderUpdates')} label="Order Updates" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Text variant="span" weight="medium">Chat Messages</Text>
            <Text variant="p" className="text-neutral-600">Notifications for new chat messages</Text>
          </div>
          <Switch checked={value.chatMessages} onClick={() => onToggle('chatMessages')} label="Chat Messages" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Text variant="span" weight="medium">Promotions & Offers</Text>
            <Text variant="p" className="text-neutral-600">Receive promotional emails and special offers</Text>
          </div>
          <Switch checked={value.promotions} onClick={() => onToggle('promotions')} label="Promotions & Offers" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Text variant="span" weight="medium">Security Alerts</Text>
            <Text variant="p" className="text-neutral-600">Important security notifications (recommended)</Text>
          </div>
          <Switch checked={value.securityAlerts} onClick={() => onToggle('securityAlerts')} label="Security Alerts" />
        </div>
      </div>
    </Card>
  );
};

export default NotificationPreferences;


