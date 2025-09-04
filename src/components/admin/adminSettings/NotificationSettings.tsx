import React from 'react';
import { Card, Text, Switch } from '../../shared';
import {
  Bell,
  AlertTriangle,
  Users,
  Shield,
  Gauge,
  Wrench,
} from 'lucide-react';
import type { AdminNotificationData } from '../../../pages/admin/adminSettings/AdminSettingsPage';

interface NotificationSettingsProps {
  value: AdminNotificationData;
  onToggle: (key: keyof AdminNotificationData) => void;
}

const ResponsiveSwitch: React.FC<{
  checked: boolean;
  onClick: () => void;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = ({ checked, onClick, label, description, icon }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="text-neutral-500">{icon}</div>
      <div>
        <Text variant="span" weight="medium">
          {label}
        </Text>
        <Text variant="p" className="text-neutral-600 text-sm">
          {description}
        </Text>
      </div>
    </div>
    <Switch
      size="responsive"
      checked={checked}
      onCheckedChange={() => onClick()}
      label={label}
    />
  </div>
);

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  value,
  onToggle,
}) => {
  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-brand-primary" />
        <Text variant="h3" size="lg" weight="semibold">
          Notification Preferences
        </Text>
      </div>

      <Text variant="p" className="text-neutral-600 mb-6">
        Choose which system events and alerts you want to be notified about
      </Text>

      <div className="space-y-5">
        <ResponsiveSwitch
          checked={value.systemAlerts}
          onClick={() => onToggle('systemAlerts')}
          label="System Alerts"
          description="Critical system notifications and warnings"
          icon={<AlertTriangle className="h-4 w-4" />}
        />

        <ResponsiveSwitch
          checked={value.userReports}
          onClick={() => onToggle('userReports')}
          label="User Reports"
          description="Notifications about user-generated reports and issues"
          icon={<Users className="h-4 w-4" />}
        />

        <ResponsiveSwitch
          checked={value.securityEvents}
          onClick={() => onToggle('securityEvents')}
          label="Security Events"
          description="Login attempts, permission changes, and security alerts"
          icon={<Shield className="h-4 w-4" />}
        />

        <ResponsiveSwitch
          checked={value.performanceIssues}
          onClick={() => onToggle('performanceIssues')}
          label="Performance Issues"
          description="System performance degradation and resource alerts"
          icon={<Gauge className="h-4 w-4" />}
        />

        <ResponsiveSwitch
          checked={value.maintenanceUpdates}
          onClick={() => onToggle('maintenanceUpdates')}
          label="Maintenance Updates"
          description="Scheduled maintenance and system update notifications"
          icon={<Wrench className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="flex items-start gap-3">
          <Bell className="h-4 w-4 text-neutral-500 mt-0.5" />
          <div>
            <Text variant="span" weight="medium" className="text-sm">
              Notification Delivery
            </Text>
            <Text variant="p" className="text-neutral-600 text-sm mt-1">
              All notifications are delivered via email and in-app alerts.
              Critical system alerts will also be sent via SMS if configured.
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NotificationSettings;
