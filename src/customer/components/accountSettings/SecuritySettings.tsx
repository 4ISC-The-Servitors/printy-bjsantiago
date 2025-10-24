import React, { useState } from 'react';
import { Card, Text, Button, Input, Modal } from '@shared/components';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@lib/supabase';
import { useToast } from '@lib/useToast';
import { usePasswordChangeDate } from '@customer/hooks/usePasswordChangeDate';

interface SecuritySettingsProps {
  onPasswordUpdated?: () => void; // Triggered after successful password update
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, toast] = useToast();
  const {
    lastPasswordChange,
    isLoading: isLoadingPasswordDate,
    error: passwordDateError,
  } = usePasswordChangeDate();

  const toggle = (k: 'current' | 'next' | 'confirm') =>
    setShow(p => ({ ...p, [k]: !p[k] }));

  // Format password change date
  const formatPasswordChangeDate = (date: Date | null): string => {
    if (!date) return 'Never';

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  // Password requirements validation
  const passwordRequirements = [
    {
      text: 'At least 8 characters',
      isValid: pw.next.length >= 8,
    },
    {
      text: 'One lowercase letter',
      isValid: /(?=.*[a-z])/.test(pw.next),
    },
    {
      text: 'One uppercase letter',
      isValid: /(?=.*[A-Z])/.test(pw.next),
    },
    {
      text: 'One number',
      isValid: /(?=.*\d)/.test(pw.next),
    },
    {
      text: 'One special character',
      isValid: /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(pw.next),
    },
  ];

  // Password confirmation validation
  const isPasswordMatch = pw.next && pw.confirm && pw.next === pw.confirm;
  const isPasswordMismatch = pw.next && pw.confirm && pw.next !== pw.confirm;

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    return errors;
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Validate new password
      const passwordErrors = validatePassword(pw.next);
      if (passwordErrors.length > 0) {
        setError(passwordErrors.join(', '));
        return;
      }

      // Check if passwords match
      if (pw.next !== pw.confirm) {
        setError('New passwords do not match');
        return;
      }

      // Update password using Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: pw.next,
      });

      if (updateError) {
        if (updateError.message.includes('Invalid login credentials')) {
          setError('Current password is incorrect');
        } else {
          setError(updateError.message);
        }
        return;
      }

      // Success
      toast.success('Password updated successfully!');
      setConfirmOpen(false);
      setIsChanging(false);
      setPw({ current: '', next: '', confirm: '' });
      setShow({ current: false, next: false, confirm: false });
      onPasswordUpdated?.();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form and errors
  const resetForm = () => {
    setIsChanging(false);
    setPw({ current: '', next: '', confirm: '' });
    setShow({ current: false, next: false, confirm: false });
    setError(null);
  };

  return (
    <Card className="p-4 md:p-6">
      <Text variant="h3" className="device-text-heading mb-4" weight="semibold">
        Security Settings
      </Text>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Text variant="span" className="device-text-body" weight="medium">
              Password
            </Text>
            <Text variant="p" className="device-text-caption text-neutral-600">
              {isLoadingPasswordDate
                ? 'Loading...'
                : passwordDateError
                  ? 'Unable to load password history'
                  : `Last changed ${formatPasswordChangeDate(lastPasswordChange)}`}
            </Text>
          </div>
          {!isChanging && (
            <Button
              variant="secondary"
              threeD
              onClick={() => setIsChanging(true)}
            >
              Change Password
            </Button>
          )}
        </div>

        {isChanging && (
          <div className="space-y-3 bg-brand-primary-50 rounded-xl border border-brand-primary-100 p-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <Text variant="p" className="text-red-700 text-sm">
                  {error}
                </Text>
              </div>
            )}
            <div>
              <Text variant="span" className="device-text-body" weight="medium">
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
                  aria-label={show.current ? 'Hide password' : 'Show password'}
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
              <Text variant="span" className="device-text-body" weight="medium">
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
                  aria-label={show.next ? 'Hide password' : 'Show password'}
                >
                  {show.next ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Password Requirements */}
              {pw.next && (
                <div className="mt-2 space-y-1">
                  <Text
                    variant="span"
                    className="device-text-caption text-neutral-600"
                  >
                    Password requirements:
                  </Text>
                  <div className="space-y-1">
                    {passwordRequirements.map((requirement, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            requirement.isValid
                              ? 'bg-green-500'
                              : 'bg-neutral-300'
                          }`}
                        >
                          {requirement.isValid && (
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <Text
                          variant="span"
                          className={`text-sm ${
                            requirement.isValid
                              ? 'text-green-700'
                              : 'text-neutral-500'
                          }`}
                        >
                          {requirement.text}
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Text variant="span" className="device-text-body" weight="medium">
                Confirm New Password
              </Text>
              <div className="relative">
                <Input
                  type={show.confirm ? 'text' : 'password'}
                  value={pw.confirm}
                  onChange={e =>
                    setPw(p => ({ ...p, confirm: e.target.value }))
                  }
                  className={
                    isPasswordMatch
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                      : isPasswordMismatch
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : ''
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => toggle('confirm')}
                  aria-label={show.confirm ? 'Hide password' : 'Show password'}
                >
                  {show.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>

                {/* Password Match Indicator */}
                {pw.confirm && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    {isPasswordMatch ? (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : isPasswordMismatch ? (
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Password Match Status Text */}
              {pw.confirm && (
                <div className="mt-1">
                  {isPasswordMatch ? (
                    <Text
                      variant="span"
                      className="text-sm text-green-700 flex items-center gap-1"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Passwords match
                    </Text>
                  ) : isPasswordMismatch ? (
                    <Text
                      variant="span"
                      className="text-sm text-red-700 flex items-center gap-1"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Passwords do not match
                    </Text>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="ghost" onClick={resetForm} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                threeD
                onClick={() => setConfirmOpen(true)}
                disabled={isLoading || !pw.current || !pw.next || !pw.confirm}
              >
                Update Password
              </Button>
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
          <div className="flex items-center justify-between p-6 pb-4">
            <Text variant="h3" className="device-text-heading">
              Confirm Password Change
            </Text>
          </div>
          <div className="px-6 pb-4">
            <Text variant="p" className="device-text-body">
              Are you sure you want to update your password?
            </Text>
          </div>
          <div className="flex items-center justify-end gap-3 p-6 pt-4">
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button threeD onClick={handlePasswordUpdate} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Confirm'}
            </Button>
          </div>
        </Card>
      </Modal>
    </Card>
  );
};

export default SecuritySettings;
