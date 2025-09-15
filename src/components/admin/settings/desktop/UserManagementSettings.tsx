import React, { useState } from 'react';
import { Card, Text, Switch, Button, Input, Modal } from '../../../shared';
import { Users, Shield, Mail, Clock, Lock } from 'lucide-react';
import type { UserManagementSettingsData } from '../_shared/types';

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

const NumberInput: React.FC<{
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  icon: React.ReactNode;
}> = ({ label, description, value, onChange, min, max, icon }) => (
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

    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={value}
        onChange={e => {
          const newValue = parseInt(e.target.value);
          if (!isNaN(newValue) && newValue >= min && newValue <= max) {
            onChange(newValue);
          }
        }}
        min={min}
        max={max}
        className="w-20 text-center"
      />
      <Text variant="span" className="text-neutral-500 text-sm">
        {label.includes('Attempts') ? 'attempts' : 'minutes'}
      </Text>
    </div>
  </div>
);

const UserManagementSettings: React.FC<{
  value: UserManagementSettingsData;
  onUpdate: (u: Partial<UserManagementSettingsData>) => void;
}> = ({ value, onUpdate }) => {
  const [confirmGuestAccess, setConfirmGuestAccess] = useState(false);

  const handleGuestAccessToggle = () => {
    if (value.allowGuestAccess) {
      // Turning off guest access - show confirmation
      setConfirmGuestAccess(true);
    } else {
      // Turning on guest access
      onUpdate({ allowGuestAccess: true });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-brand-primary" />
        <Text variant="h3" size="lg" weight="semibold">
          User Management Settings
        </Text>
      </div>

      <Text variant="p" className="text-neutral-600 mb-6">
        Configure user registration, verification, and access policies
      </Text>

      <div className="space-y-5">
        <ResponsiveSwitch
          checked={value.autoApproval}
          onClick={() => onUpdate({ autoApproval: !value.autoApproval })}
          label="Auto-approve New Users"
          description="Automatically approve user registrations without manual review"
          icon={<Shield className="h-4 w-4" />}
        />

        <ResponsiveSwitch
          checked={value.requireEmailVerification}
          onClick={() =>
            onUpdate({
              requireEmailVerification: !value.requireEmailVerification,
            })
          }
          label="Require Email Verification"
          description="Users must verify their email before accessing the system"
          icon={<Mail className="h-4 w-4" />}
        />

        <ResponsiveSwitch
          checked={value.allowGuestAccess}
          onClick={handleGuestAccessToggle}
          label="Allow Guest Access"
          description="Enable limited access for unregistered users"
          icon={<Users className="h-4 w-4" />}
        />

        <NumberInput
          label="Maximum Login Attempts"
          description="Number of failed login attempts before account lockout"
          value={value.maxLoginAttempts}
          onChange={newValue => onUpdate({ maxLoginAttempts: newValue })}
          min={3}
          max={10}
          icon={<Lock className="h-4 w-4" />}
        />

        <NumberInput
          label="Session Timeout"
          description="Minutes of inactivity before automatic logout"
          value={value.sessionTimeout}
          onChange={newValue => onUpdate({ sessionTimeout: newValue })}
          min={15}
          max={120}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* Guest Access Confirmation Modal */}
      <Modal
        isOpen={confirmGuestAccess}
        onClose={() => setConfirmGuestAccess(false)}
        size="sm"
      >
        <Card className="p-0">
          <div className="flex items-center gap-3 p-6 pb-4">
            <div className="h-10 w-10 rounded-full bg-warning-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-warning-600" />
            </div>
            <Text variant="h3" size="lg" weight="semibold">
              Disable Guest Access
            </Text>
          </div>

          <div className="px-6 pb-4">
            <Text variant="p" className="mb-3">
              Disabling guest access will:
            </Text>
            <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
              <li>Block all unregistered users from accessing the system</li>
              <li>Require registration for any system access</li>
              <li>Affect current guest users immediately</li>
            </ul>
            <Text variant="p" className="mt-3 text-warning-600 font-medium">
              Are you sure you want to disable guest access?
            </Text>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 pt-4">
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
              Disable Guest Access
            </Button>
          </div>
        </Card>
      </Modal>
    </Card>
  );
};

export default UserManagementSettings;
