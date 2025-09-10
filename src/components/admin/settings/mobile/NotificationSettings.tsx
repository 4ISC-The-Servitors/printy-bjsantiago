import React from 'react';
import { Card, Text, Switch } from '../../../shared';
import {
  Bell,
  AlertTriangle,
  Users,
  Shield,
  Gauge,
  Wrench,
} from 'lucide-react';
import type { AdminNotificationData } from '../../../../pages/admin/adminSettings/AdminSettingsPage';

interface NotificationSettingsProps {
  value: AdminNotificationData;
  onToggle: (key: keyof AdminNotificationData) => void;
}

const MobileSwitch: React.FC<{
  checked: boolean;
  onClick: () => void;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = ({ checked, onClick, label, description, icon }) => (
  <div className="p-4 border-b border-neutral-200">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="text-neutral-500 mt-1">{icon}</div>
        <div className="min-w-0 flex-1">
          <Text variant="h4" size="base" weight="medium" className="mb-1">
            {label}
          </Text>
          <Text variant="p" size="sm" color="muted">
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
  </div>
);

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  value,
  onToggle,
}) => {
  return (
    <div className="space-y-6">
      <div className="px-4">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="h-6 w-6 text-brand-primary" />
          <Text variant="h2" size="xl" weight="semibold">
            Notifications
          </Text>
        </div>
        <Text variant="p" size="sm" color="muted">
          Choose which system events and alerts you want to be notified about
        </Text>
      </div>

      <Card className="p-0">
        <MobileSwitch
          checked={value.systemAlerts}
          onClick={() => onToggle('systemAlerts')}
          label="System Alerts"
          description="Critical system notifications and warnings"
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <MobileSwitch
          checked={value.userReports}
          onClick={() => onToggle('userReports')}
          label="User Reports"
          description="Notifications about user-generated reports and issues"
          icon={<Users className="h-5 w-5" />}
        />

        <MobileSwitch
          checked={value.securityEvents}
          onClick={() => onToggle('securityEvents')}
          label="Security Events"
          description="Login attempts, permission changes, and security alerts"
          icon={<Shield className="h-5 w-5" />}
        />

        <MobileSwitch
          checked={value.performanceIssues}
          onClick={() => onToggle('performanceIssues')}
          label="Performance Issues"
          description="System performance degradation and resource alerts"
          icon={<Gauge className="h-5 w-5" />}
        />

        <MobileSwitch
          checked={value.maintenanceUpdates}
          onClick={() => onToggle('maintenanceUpdates')}
          label="Maintenance Updates"
          description="Scheduled maintenance and system update notifications"
          icon={<Wrench className="h-5 w-5" />}
        />
      </Card>

      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
          <div>
            <Text variant="h4" size="sm" weight="medium" className="mb-2">
              Notification Delivery
            </Text>
            <Text variant="p" size="sm" color="muted">
              All notifications are delivered via email and in-app alerts.
              Critical system alerts will also be sent via SMS if configured.
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotificationSettings;
