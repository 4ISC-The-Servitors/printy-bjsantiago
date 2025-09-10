import React, { useState } from 'react';
import { Card, Text, Switch, Button, Modal } from '../../../shared';
import { Settings, Database, Bug, Gauge, Trash2 } from 'lucide-react';
import type {
  SystemPreferencesData,
  DataRetentionOption,
} from '../_shared/types';

interface SystemPreferencesProps {
  value: SystemPreferencesData;
  onUpdate: (updates: Partial<SystemPreferencesData>) => void;
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

const SystemPreferences: React.FC<SystemPreferencesProps> = ({
  value,
  onUpdate,
}) => {
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [dataRetentionModalOpen, setDataRetentionModalOpen] = useState(false);

  const handleMaintenanceToggle = () => {
    if (value.maintenanceMode) {
      // Turning off maintenance mode
      onUpdate({ maintenanceMode: false });
    } else {
      // Turning on maintenance mode - show confirmation
      setMaintenanceModalOpen(true);
    }
  };

  const handleDataRetentionChange = (retention: DataRetentionOption) => {
    onUpdate({ dataRetention: retention });
    setDataRetentionModalOpen(false);
  };

  const getDataRetentionLabel = (retention: DataRetentionOption) => {
    const labels = {
      '30_days': '30 Days',
      '90_days': '90 Days',
      '1_year': '1 Year',
      indefinite: 'Indefinite',
    };
    return labels[retention];
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5 text-brand-primary" />
        <Text variant="h3" size="lg" weight="semibold">
          System Preferences
        </Text>
      </div>

      <Text variant="p" className="text-neutral-600 mb-6">
        Configure system-wide settings and behaviors
      </Text>

      <div className="space-y-5">
        <ResponsiveSwitch
          checked={value.autoBackup}
          onClick={() => onUpdate({ autoBackup: !value.autoBackup })}
          label="Automatic Backups"
          description="Daily automated system backups"
          icon={<Database className="h-4 w-4" />}
        />

        <ResponsiveSwitch
          checked={value.maintenanceMode}
          onClick={handleMaintenanceToggle}
          label="Maintenance Mode"
          description="Restrict user access during system maintenance"
          icon={<Settings className="h-4 w-4" />}
        />

        <ResponsiveSwitch
          checked={value.debugLogging}
          onClick={() => onUpdate({ debugLogging: !value.debugLogging })}
          label="Debug Logging"
          description="Enable detailed system logging for troubleshooting"
          icon={<Bug className="h-4 w-4" />}
        />

        <ResponsiveSwitch
          checked={value.performanceMonitoring}
          onClick={() =>
            onUpdate({ performanceMonitoring: !value.performanceMonitoring })
          }
          label="Performance Monitoring"
          description="Track system performance metrics"
          icon={<Gauge className="h-4 w-4" />}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-neutral-500">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <Text variant="span" weight="medium">
                Data Retention Policy
              </Text>
              <Text variant="p" className="text-neutral-600 text-sm">
                How long to keep system logs and temporary data
              </Text>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDataRetentionModalOpen(true)}
            className="min-w-[120px]"
          >
            {getDataRetentionLabel(value.dataRetention)}
          </Button>
        </div>
      </div>

      {/* Maintenance Mode Confirmation Modal */}
      <Modal
        isOpen={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
        size="sm"
      >
        <Card className="p-0">
          <div className="flex items-center gap-3 p-6 pb-4">
            <div className="h-10 w-10 rounded-full bg-warning-100 flex items-center justify-center">
              <Settings className="h-5 w-5 text-warning-600" />
            </div>
            <Text variant="h3" size="lg" weight="semibold">
              Enable Maintenance Mode
            </Text>
          </div>

          <div className="px-6 pb-4">
            <Text variant="p" className="mb-3">
              Maintenance mode will:
            </Text>
            <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
              <li>Restrict customer access to the system</li>
              <li>Show maintenance page to all users</li>
              <li>Allow admin operations to continue</li>
            </ul>
            <Text variant="p" className="mt-3 text-warning-600 font-medium">
              Are you sure you want to enable maintenance mode?
            </Text>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 pt-4">
            <Button
              variant="ghost"
              onClick={() => setMaintenanceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="warning"
              onClick={() => {
                onUpdate({ maintenanceMode: true });
                setMaintenanceModalOpen(false);
              }}
            >
              Enable Maintenance Mode
            </Button>
          </div>
        </Card>
      </Modal>

      {/* Data Retention Modal */}
      <Modal
        isOpen={dataRetentionModalOpen}
        onClose={() => setDataRetentionModalOpen(false)}
        size="sm"
      >
        <Card className="p-0">
          <div className="flex items-center gap-3 p-6 pb-4">
            <div className="h-10 w-10 rounded-full bg-info-100 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-info-600" />
            </div>
            <Text variant="h3" size="lg" weight="semibold">
              Data Retention Policy
            </Text>
          </div>

          <div className="px-6 pb-4">
            <Text variant="p" className="mb-4">
              Select how long to retain system data:
            </Text>
            <div className="space-y-2">
              {(['30_days', '90_days', '1_year', 'indefinite'] as const).map(
                option => (
                  <Button
                    key={option}
                    variant={
                      value.dataRetention === option ? 'primary' : 'ghost'
                    }
                    className="w-full justify-start"
                    onClick={() => handleDataRetentionChange(option)}
                  >
                    {getDataRetentionLabel(option)}
                  </Button>
                )
              )}
            </div>
          </div>
        </Card>
      </Modal>
    </Card>
  );
};

export default SystemPreferences;
