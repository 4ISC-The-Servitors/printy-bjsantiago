import React, { useState } from 'react';
import { Card, Text, Button, Input, Modal } from '@shared/components';
import { Pencil } from 'lucide-react';

export interface AdminUserData {
  displayName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  province: string;
  barangay: string;
  building: string;
  avatarUrl?: string;
  firstName: string;
  lastName: string;
}

interface PersonalInfoFormProps {
  value: AdminUserData;
  onSave: (partial: Partial<AdminUserData>) => void;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  value,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<AdminUserData>(value);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

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
    if (!form.email.trim()) next.email = 'Email is required';
    const phoneLocal = getLocalDigitsFromPhone(form.phone);
    if (phoneLocal.length !== 10)
      next.phone = 'Enter a valid PH mobile (9xxxxxxxxx)';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    setConfirmOpen(true);
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
    <Card className="device-spacing-component relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <Text variant="h3" className="device-text-heading" weight="semibold">
            Personal Information
          </Text>
          <Text variant="p" className="device-text-body text-neutral-600 mt-1">
            Update your personal details and contact information
          </Text>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2">
            <Button
              onClick={startEdit}
              variant="secondary"
              size="sm"
              threeD
              className="device-btn-secondary flex items-center justify-center"
              aria-label="Edit personal information"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Text variant="span" className="device-text-body" weight="medium">
            Display Name
          </Text>
          <Text
            variant="p"
            className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
          >
            {value.displayName}
          </Text>
        </div>

        <div>
          <Text variant="span" className="device-text-body" weight="medium">
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
              className="text-error mt-1 device-text-caption"
            >
              {errors.email}
            </Text>
          )}
        </div>

        <div>
          <Text variant="span" className="device-text-body" weight="medium">
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
              className="text-error mt-1 device-text-caption"
            >
              {errors.phone}
            </Text>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Text variant="span" className="device-text-body" weight="medium">
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
            <Text variant="span" className="device-text-body" weight="medium">
              Building
            </Text>
            {isEditing ? (
              <Input
                value={form.building}
                onChange={e =>
                  setForm(p => ({ ...p, building: e.target.value }))
                }
              />
            ) : (
              <Text
                variant="p"
                className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
              >
                {value.building || 'Not specified'}
              </Text>
            )}
          </div>
          <div>
            <Text variant="span" className="device-text-body" weight="medium">
              Barangay
            </Text>
            {isEditing ? (
              <Input
                value={form.barangay}
                onChange={e =>
                  setForm(p => ({ ...p, barangay: e.target.value }))
                }
              />
            ) : (
              <Text
                variant="p"
                className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
              >
                {value.barangay || 'Not specified'}
              </Text>
            )}
          </div>
          <div>
            <Text variant="span" className="device-text-body" weight="medium">
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
            <Text variant="span" className="device-text-body" weight="medium">
              Province
            </Text>
            {isEditing ? (
              <Input
                value={form.province}
                onChange={e =>
                  setForm(p => ({ ...p, province: e.target.value }))
                }
              />
            ) : (
              <Text
                variant="p"
                className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
              >
                {value.province || 'Not specified'}
              </Text>
            )}
          </div>
          <div>
            <Text variant="span" className="device-text-body" weight="medium">
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
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="ghost" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button onClick={save} threeD>
              Save Changes
            </Button>
          </div>
        )}
      </div>
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="sm"
      >
        <Card className="p-0">
          <div className="flex items-center justify-between device-spacing-component pb-4">
            <Text
              variant="h3"
              className="device-text-heading"
              weight="semibold"
            >
              Confirm Save
            </Text>
          </div>
          <div className="device-spacing-component pb-4">
            <Text variant="p" className="device-text-body">
              Are you sure you want to save these changes to your personal
              information?
            </Text>
          </div>
          <div className="flex items-center justify-end gap-3 device-spacing-component pt-4">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              threeD
              onClick={() => {
                setConfirmOpen(false);
                onSave(form);
                setIsEditing(false);
              }}
            >
              Confirm
            </Button>
          </div>
        </Card>
      </Modal>
    </Card>
  );
};

export default PersonalInfoForm;
