import React, { useState } from 'react';
import { Card, Text, Button, Input } from '../../shared';
import { Eye, EyeOff } from 'lucide-react';

const SecuritySettings: React.FC = () => {
  const [isChanging, setIsChanging] = useState(false);
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

  const toggle = (k: 'current' | 'next' | 'confirm') => setShow((p) => ({ ...p, [k]: !p[k] }));

  return (
    <Card className="p-4 md:p-6">
      <Text variant="h3" size="lg" weight="semibold" className="mb-4">Security Settings</Text>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Text variant="span" weight="medium">Password</Text>
            <Text variant="p" className="text-neutral-600">Last changed 30 days ago</Text>
          </div>
          {!isChanging && (
            <Button variant="secondary" onClick={() => setIsChanging(true)}>Change Password</Button>
          )}
        </div>

        {isChanging && (
          <div className="space-y-3 bg-brand-primary-50 rounded-xl border border-brand-primary-100 p-4">
            <div>
              <Text variant="span" weight="medium">Current Password</Text>
              <div className="relative">
                <Input
                  type={show.current ? 'text' : 'password'}
                  value={pw.current}
                  onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => toggle('current')}
                  aria-label={show.current ? 'Hide password' : 'Show password'}
                >
                  {show.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Text variant="span" weight="medium">New Password</Text>
              <div className="relative">
                <Input
                  type={show.next ? 'text' : 'password'}
                  value={pw.next}
                  onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => toggle('next')}
                  aria-label={show.next ? 'Hide password' : 'Show password'}
                >
                  {show.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Text variant="span" weight="medium">Confirm New Password</Text>
              <div className="relative">
                <Input
                  type={show.confirm ? 'text' : 'password'}
                  value={pw.confirm}
                  onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => toggle('confirm')}
                  aria-label={show.confirm ? 'Hide password' : 'Show password'}
                >
                  {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="ghost" onClick={() => setIsChanging(false)}>Cancel</Button>
              <Button threeD onClick={() => setIsChanging(false)}>Update Password</Button>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <Text variant="span" weight="medium">Two-Factor Authentication</Text>
              <Text variant="p" className="text-neutral-600">Add an extra layer of security to your account</Text>
            </div>
            <Button variant="warning">Enable 2FA</Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SecuritySettings;


