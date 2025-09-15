import React, { useState } from 'react';
import { Card, Text, Button, Input, Modal } from '../../../shared';
import { Eye, EyeOff, Shield, Key } from 'lucide-react';
import type { SecuritySettingsProps } from '../_shared/types';

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  onPasswordUpdated,
}) => {
  const [isChanging, setIsChanging] = useState(false);
  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toggle = (k: 'current' | 'next' | 'confirm') =>
    setShow(p => ({ ...p, [k]: !p[k] }));

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-5 w-5 text-brand-primary" />
        <Text variant="h3" size="lg" weight="semibold">
          Security Settings
        </Text>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Text variant="span" weight="medium">
              Admin Password
            </Text>
            <Text variant="p" className="text-neutral-600">
              Last changed 30 days ago
            </Text>
          </div>
          {!isChanging && (
            <Button variant="secondary" onClick={() => setIsChanging(true)}>
              Change
            </Button>
          )}
        </div>

        {isChanging && (
          <div className="space-y-3 bg-brand-primary-50 rounded-xl border border-brand-primary-100 p-3">
            <div>
              <Text variant="span" weight="medium">
                Current Password
              </Text>
              <div className="relative">
                <Input
                  type={show.current ? 'text' : 'password'}
                  value={pw.current}
                  onChange={e =>
                    setPw(p => ({ ...p, current: e.target.value }))
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => toggle('current')}
                >
                  {show.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Text variant="span" weight="medium">
                New Password
              </Text>
              <div className="relative">
                <Input
                  type={show.next ? 'text' : 'password'}
                  value={pw.next}
                  onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => toggle('next')}
                >
                  {show.next ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Text variant="span" weight="medium">
                Confirm New Password
              </Text>
              <div className="relative">
                <Input
                  type={show.confirm ? 'text' : 'password'}
                  value={pw.confirm}
                  onChange={e =>
                    setPw(p => ({ ...p, confirm: e.target.value }))
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => toggle('confirm')}
                >
                  {show.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="ghost" onClick={() => setIsChanging(false)}>
                Cancel
              </Button>
              <Button onClick={() => setConfirmOpen(true)}>Update</Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="sm"
      >
        <Card className="p-0">
          <div className="flex items-center gap-3 p-4 pb-3">
            <div className="h-10 w-10 rounded-full bg-warning-100 flex items-center justify-center">
              <Key className="h-5 w-5 text-warning-600" />
            </div>
            <Text variant="h3" size="lg" weight="semibold">
              Confirm Password Change
            </Text>
          </div>
          <div className="px-4 pb-4">
            <Text variant="p">
              Are you sure you want to update your admin password? This will log
              you out of all active sessions.
            </Text>
            <div className="flex items-center justify-end gap-3 mt-3">
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setConfirmOpen(false);
                  setIsChanging(false);
                  setPw({ current: '', next: '', confirm: '' });
                  onPasswordUpdated?.();
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </Card>
      </Modal>
    </Card>
  );
};

export default SecuritySettings;
