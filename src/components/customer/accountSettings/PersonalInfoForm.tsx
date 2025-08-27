import React, { useState } from 'react';
import { Card, Text, Button, Input } from '../../shared';
import { Pencil } from 'lucide-react';
import type { UserData } from '../../../pages/customer/accountSettings/AccountSettingsPage';

interface PersonalInfoFormProps {
  value: UserData;
  onSave: (partial: Partial<UserData>) => void;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  value,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<UserData>(value);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const startEdit = () => {
    setForm(value);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setErrors({});
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.displayName.trim()) next.displayName = 'Display name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    const phoneLocal = getLocalDigitsFromPhone(form.phone);
    if (phoneLocal.length !== 10)
      next.phone = 'Enter a valid PH mobile (9xxxxxxxxx)';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    onSave(form);
    setIsEditing(false);
  };

  const getLocalDigitsFromPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    let local = digits.startsWith('63') ? digits.slice(2) : digits;
    if (local.startsWith('0')) local = local.slice(1);
    if (!local.startsWith('9')) {
      local = `9${local.replace(/^9?/, '')}`;
    }
    return local.slice(0, 10);
  };

  const formatPHMobile = (localDigits: string) => `+63 ${localDigits}`;

  return (
    <Card className="p-4 md:p-6 relative">
      {!isEditing && (
        <Button
          onClick={startEdit}
          variant="secondary"
          size="sm"
          threeD
          className="md:hidden h-9 w-9 p-0 flex items-center justify-center absolute top-3 right-3"
          aria-label="Edit personal information"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <div>
          <Text variant="h3" size="lg" weight="semibold">
            Personal Information
          </Text>
          <Text variant="p" className="text-neutral-600 mt-1">
            Update your personal details and contact information
          </Text>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2">
            {/* Tablet/Desktop: icon-only as default */}
            <Button
              onClick={startEdit}
              variant="secondary"
              size="sm"
              threeD
              className="hidden md:inline-flex h-9 w-9 p-0 items-center justify-center"
              aria-label="Edit personal information"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Text variant="span" weight="medium">
            Display Name
          </Text>
          {isEditing ? (
            <Input
              value={form.displayName}
              onChange={e =>
                setForm(p => ({ ...p, displayName: e.target.value }))
              }
              aria-invalid={Boolean(errors.displayName)}
              aria-describedby={
                errors.displayName ? 'displayName-error' : undefined
              }
            />
          ) : (
            <Text
              variant="p"
              className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
            >
              {value.displayName}
            </Text>
          )}
          {errors.displayName && (
            <Text
              id="displayName-error"
              variant="p"
              className="text-error mt-1 text-sm"
            >
              {errors.displayName}
            </Text>
          )}
        </div>

        <div>
          <Text variant="span" weight="medium">
            Email Address
          </Text>
          {isEditing ? (
            <Input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
          ) : (
            <Text
              variant="p"
              className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
            >
              {value.email}
            </Text>
          )}
          {errors.email && (
            <Text
              id="email-error"
              variant="p"
              className="text-error mt-1 text-sm"
            >
              {errors.email}
            </Text>
          )}
        </div>

        <div>
          <Text variant="span" weight="medium">
            Phone Number
          </Text>
          {isEditing ? (
            <Input
              type="tel"
              value={getLocalDigitsFromPhone(form.phone)}
              onChange={e => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setForm(p => ({ ...p, phone: formatPHMobile(digits) }));
              }}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
              maxLength={10}
            />
          ) : (
            <Text
              variant="p"
              className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
            >
              {formatPHMobile(getLocalDigitsFromPhone(value.phone))}
            </Text>
          )}
          {errors.phone && (
            <Text
              id="phone-error"
              variant="p"
              className="text-error mt-1 text-sm"
            >
              {errors.phone}
            </Text>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text variant="span" weight="medium">
              Street Address
            </Text>
            {isEditing ? (
              <Input
                value={form.address}
                onChange={e =>
                  setForm(p => ({ ...p, address: e.target.value }))
                }
              />
            ) : (
              <Text
                variant="p"
                className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
              >
                {value.address}
              </Text>
            )}
          </div>
          <div>
            <Text variant="span" weight="medium">
              City
            </Text>
            {isEditing ? (
              <Input
                value={form.city}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              />
            ) : (
              <Text
                variant="p"
                className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
              >
                {value.city}
              </Text>
            )}
          </div>
          <div>
            <Text variant="span" weight="medium">
              ZIP Code
            </Text>
            {isEditing ? (
              <Input
                value={form.zipCode}
                onChange={e =>
                  setForm(p => ({ ...p, zipCode: e.target.value }))
                }
              />
            ) : (
              <Text
                variant="p"
                className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
              >
                {value.zipCode}
              </Text>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex flex-col md:flex-row gap-3 pt-2">
            <Button variant="ghost" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button onClick={save} threeD>
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PersonalInfoForm;
