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

const Row: React.FC<{
  label: string;
  description: string;
  icon: React.ReactNode;
  right?: React.ReactNode;
}> = ({ label, description, icon, right }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex items-start gap-3">
      <div className="text-neutral-500 mt-0.5">{icon}</div>
      <div>
        <Text variant="span" weight="medium">
          {label}
        </Text>
        <Text variant="p" className="text-neutral-600 text-sm">
          {description}
        </Text>
      </div>
    </div>
    {right}
  </div>
);

const SystemPreferences: React.FC<SystemPreferencesProps> = ({
  value,
  onUpdate,
}) => {
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [dataRetentionModalOpen, setDataRetentionModalOpen] = useState(false);

  const handleMaintenanceToggle = () => {
    if (value.maintenanceMode) onUpdate({ maintenanceMode: false });
    else setMaintenanceModalOpen(true);
  };

  const handleDataRetentionChange = (retention: DataRetentionOption) => {
    onUpdate({ dataRetention: retention });
    setDataRetentionModalOpen(false);
  };

  const getDataRetentionLabel = (retention: DataRetentionOption) => {
    const labels: Record<DataRetentionOption, string> = {
      '30_days': '30 Days',
      '90_days': '90 Days',
      '1_year': '1 Year',
      indefinite: 'Indefinite',
    };
    return labels[retention];
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="h-5 w-5 text-brand-primary" />
        <Text variant="h3" size="lg" weight="semibold">
          System Preferences
        </Text>
      </div>

      <div className="space-y-4">
        <Row
          label="Automatic Backups"
          description="Daily automated system backups"
          icon={<Database className="h-4 w-4" />}
          right={
            <Switch
              size="responsive"
              checked={value.autoBackup}
              onCheckedChange={() =>
                onUpdate({ autoBackup: !value.autoBackup })
              }
              label="Automatic Backups"
            />
          }
        />

        <Row
          label="Maintenance Mode"
          description="Restrict user access during maintenance"
          icon={<Settings className="h-4 w-4" />}
          right={
            <Switch
              size="responsive"
              checked={value.maintenanceMode}
              onCheckedChange={handleMaintenanceToggle}
              label="Maintenance Mode"
            />
          }
        />

        <Row
          label="Debug Logging"
          description="Enable detailed system logging"
          icon={<Bug className="h-4 w-4" />}
          right={
            <Switch
              size="responsive"
              checked={value.debugLogging}
              onCheckedChange={() =>
                onUpdate({ debugLogging: !value.debugLogging })
              }
              label="Debug Logging"
            />
          }
        />

        <Row
          label="Performance Monitoring"
          description="Track system performance metrics"
          icon={<Gauge className="h-4 w-4" />}
          right={
            <Switch
              size="responsive"
              checked={value.performanceMonitoring}
              onCheckedChange={() =>
                onUpdate({
                  performanceMonitoring: !value.performanceMonitoring,
                })
              }
              label="Performance Monitoring"
            />
          }
        />

        <Row
          label="Data Retention Policy"
          description="How long to keep system data"
          icon={<Trash2 className="h-4 w-4" />}
          right={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDataRetentionModalOpen(true)}
            >
              {getDataRetentionLabel(value.dataRetention)}
            </Button>
          }
        />
      </div>

      <Modal
        isOpen={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
        size="sm"
      >
        <Card className="p-0">
          <div className="flex items-center gap-3 p-4 pb-3">
            <div className="h-10 w-10 rounded-full bg-warning-100 flex items-center justify-center">
              <Settings className="h-5 w-5 text-warning-600" />
            </div>
            <Text variant="h3" size="lg" weight="semibold">
              Enable Maintenance Mode
            </Text>
          </div>
          <div className="px-4 pb-4">
            <Text variant="p" className="mb-3">
              Maintenance mode will restrict customer access and show a
              maintenance page.
            </Text>
            <div className="flex items-center justify-end gap-3">
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
                Enable
              </Button>
            </div>
          </div>
        </Card>
      </Modal>

      <Modal
        isOpen={dataRetentionModalOpen}
        onClose={() => setDataRetentionModalOpen(false)}
        size="sm"
      >
        <Card className="p-0">
          <div className="flex items-center gap-3 p-4 pb-3">
            <div className="h-10 w-10 rounded-full bg-info-100 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-info-600" />
            </div>
            <Text variant="h3" size="lg" weight="semibold">
              Data Retention Policy
            </Text>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {(['30_days', '90_days', '1_year', 'indefinite'] as const).map(
              option => (
                <Button
                  key={option}
                  variant={value.dataRetention === option ? 'primary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleDataRetentionChange(option)}
                >
                  {getDataRetentionLabel(option)}
                </Button>
              )
            )}
          </div>
        </Card>
      </Modal>
    </Card>
  );
};

export default SystemPreferences;
