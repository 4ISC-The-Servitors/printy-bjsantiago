import React from 'react';
import { Card, Text, Switch } from '../../../shared';
import type { NotificationPreferencesData } from '../../../../pages/customer/AccountSettings';

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
      <Text variant="h3" size="lg" weight="semibold" className="mb-4">
        Notification Preferences
      </Text>
      <Text variant="p" className="text-neutral-600 mb-6">
        Choose how you want to be notified about account activity
      </Text>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Text variant="span" weight="medium">
              Email Notifications
            </Text>
            <Text variant="p" className="text-neutral-600">
              Receive notifications via email
            </Text>
          </div>
          <ResponsiveSwitch
            checked={value.emailNotifications}
            onClick={() => onToggle('emailNotifications')}
            label="Email Notifications"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Text variant="span" weight="medium">
              SMS Notifications
            </Text>
            <Text variant="p" className="text-neutral-600">
              Receive notifications via SMS
            </Text>
          </div>
          <ResponsiveSwitch
            checked={value.smsNotifications}
            onClick={() => onToggle('smsNotifications')}
            label="SMS Notifications"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Text variant="span" weight="medium">
              Order Updates
            </Text>
            <Text variant="p" className="text-neutral-600">
              Get notified about order status changes
            </Text>
          </div>
          <ResponsiveSwitch
            checked={value.orderUpdates}
            onClick={() => onToggle('orderUpdates')}
            label="Order Updates"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Text variant="span" weight="medium">
              Ticket Updates
            </Text>
            <Text variant="p" className="text-neutral-600">
              Important ticket updates
            </Text>
          </div>
          <ResponsiveSwitch
            checked={value.ticketUpdates}
            onClick={() => onToggle('ticketUpdates')}
            label="Ticket Updates"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Text variant="span" weight="medium">
              Chat Messages
            </Text>
            <Text variant="p" className="text-neutral-600">
              Notifications for new chat messages
            </Text>
          </div>
          <ResponsiveSwitch
            checked={value.chatMessages}
            onClick={() => onToggle('chatMessages')}
            label="Chat Messages"
          />
        </div>
      </div>
    </Card>
  );
};

export default NotificationPreferences;
