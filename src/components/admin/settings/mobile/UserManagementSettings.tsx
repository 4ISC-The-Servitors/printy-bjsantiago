import React, { useState } from 'react';
import { Card, Text, Switch, Button, Input, Modal } from '../../../shared';
import { Users, Shield, Mail, Clock, Lock } from 'lucide-react';
import type { UserManagementSettingsData } from '../_shared/types';

interface Props {
  value: UserManagementSettingsData;
  onUpdate: (updates: Partial<UserManagementSettingsData>) => void;
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

const NumberInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  suffix: string;
}> = ({ value, onChange, suffix }) => (
  <div className="flex items-center gap-2">
    <Input
      type="number"
      value={value}
      onChange={e => {
        const n = parseInt(e.target.value);
        if (!isNaN(n)) onChange(n);
      }}
      className="w-20 text-center"
    />
    <Text variant="span" className="text-neutral-500 text-sm">
      {suffix}
    </Text>
  </div>
);

const UserManagementSettings: React.FC<Props> = ({ value, onUpdate }) => {
  const [confirmGuestAccess, setConfirmGuestAccess] = useState(false);

  const handleGuestAccessToggle = () => {
    if (value.allowGuestAccess) setConfirmGuestAccess(true);
    else onUpdate({ allowGuestAccess: true });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-5 w-5 text-brand-primary" />
        <Text variant="h3" size="lg" weight="semibold">
          User Management
        </Text>
      </div>

      <div className="space-y-4">
        <Row
          label="Auto-approve New Users"
          description="Approve new registrations automatically"
          icon={<Shield className="h-4 w-4" />}
          right={
            <Switch
              size="responsive"
              checked={value.autoApproval}
              onCheckedChange={() =>
                onUpdate({ autoApproval: !value.autoApproval })
              }
              label="Auto-approve"
            />
          }
        />

        <Row
          label="Require Email Verification"
          description="Users must verify email before access"
          icon={<Mail className="h-4 w-4" />}
          right={
            <Switch
              size="responsive"
              checked={value.requireEmailVerification}
              onCheckedChange={() =>
                onUpdate({
                  requireEmailVerification: !value.requireEmailVerification,
                })
              }
              label="Email Verification"
            />
          }
        />

        <Row
          label="Allow Guest Access"
          description="Enable limited access for guests"
          icon={<Users className="h-4 w-4" />}
          right={
            <Switch
              size="responsive"
              checked={value.allowGuestAccess}
              onCheckedChange={handleGuestAccessToggle}
              label="Guest Access"
            />
          }
        />

        <Row
          label="Maximum Login Attempts"
          description="Failed attempts before lockout"
          icon={<Lock className="h-4 w-4" />}
          right={
            <NumberInput
              value={value.maxLoginAttempts}
              onChange={n => onUpdate({ maxLoginAttempts: n })}
              suffix="attempts"
            />
          }
        />

        <Row
          label="Session Timeout"
          description="Minutes of inactivity before logout"
          icon={<Clock className="h-4 w-4" />}
          right={
            <NumberInput
              value={value.sessionTimeout}
              onChange={n => onUpdate({ sessionTimeout: n })}
              suffix="minutes"
            />
          }
        />
      </div>

      <Modal
        isOpen={confirmGuestAccess}
        onClose={() => setConfirmGuestAccess(false)}
        size="sm"
      >
        <Card className="p-0">
          <div className="flex items-center gap-3 p-4 pb-3">
            <div className="h-10 w-10 rounded-full bg-warning-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-warning-600" />
            </div>
            <Text variant="h3" size="lg" weight="semibold">
              Disable Guest Access
            </Text>
          </div>
          <div className="px-4 pb-4">
            <Text variant="p" className="mb-3">
              Disabling guest access will block all unregistered users
              immediately.
            </Text>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setConfirmGuestAccess(false)}
              >
                Cancel
              </Button>
              <Button
                variant="warning"
                onClick={() => {
                  onUpdate({ allowGuestAccess: false });
                  setConfirmGuestAccess(false);
                }}
              >
                Disable
              </Button>
            </div>
          </div>
        </Card>
      </Modal>
    </Card>
  );
};

export default UserManagementSettings;
