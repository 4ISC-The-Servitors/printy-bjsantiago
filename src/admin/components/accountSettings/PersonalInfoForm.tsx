import React, { useState, useCallback, useEffect } from 'react';
import { Card, Text, Button, Input, Modal } from '@shared/components';
import { Pencil } from 'lucide-react';
import SearchableSelect from '@shared/components/ui/SearchableSelect';
import {
  cityOptions,
  provinceOptions,
  regionOptions,
  findRegionIdByName,
  findProvinceIdByName,
  findCityIdByName,
} from '@shared/services/locationService';
import {
  normalizePhone,
  getPhoneValidationMessage,
  formatToProperNoun,
  formatZipCodeInput,
  getStreetValidationMessage,
  getBarangayValidationMessage,
  getBuildingNumberValidationMessage,
  getZipValidationMessage,
} from '@/shared/utils/formsFormatter';

export interface AdminUserData {
  displayName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  province: string;
  region: string;
  barangay: string;
  building: string;
  avatarUrl?: string;
  firstName: string;
  lastName: string;
  gender?: string;
  birthday?: string;
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
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedRegionLabel, setSelectedRegionLabel] = useState<string>('');
  const [selectedProvinceLabel, setSelectedProvinceLabel] =
    useState<string>('');
  const [selectedCityLabel, setSelectedCityLabel] = useState<string>('');

  // Fetchers bound to current selection
  const fetchRegions = useCallback((q: string) => regionOptions(q), []);
  const fetchProvinces = useCallback(
    (q: string) => provinceOptions(selectedRegionId, q),
    [selectedRegionId]
  );
  const fetchCities = useCallback(
    (q: string) => cityOptions(selectedProvinceId, q),
    [selectedProvinceId]
  );

  // Derive placeholders
  const provinceDisabled = !selectedRegionId;
  const cityDisabled = !selectedProvinceId;

  // Sync form state when value changes
  useEffect(() => {
    if (!isEditing) {
      setForm(value);
    }
  }, [value, isEditing]);

  // Initialize region/province/city IDs when entering edit mode or when value changes
  useEffect(() => {
    const initializeLocationIds = async () => {
      if (!value.region && !value.province && !value.city) {
        setSelectedRegionId('');
        setSelectedProvinceId('');
        setSelectedCityId('');
        setSelectedRegionLabel('');
        setSelectedProvinceLabel('');
        setSelectedCityLabel('');
        return;
      }

      // Find region ID and set label
      if (value.region) {
        const regionId = await findRegionIdByName(value.region);
        if (regionId) {
          setSelectedRegionId(regionId);
          setSelectedRegionLabel(value.region);

          // Find province ID if region found
          if (value.province && regionId) {
            const provinceId = await findProvinceIdByName(
              value.province,
              regionId
            );
            if (provinceId) {
              setSelectedProvinceId(provinceId);
              setSelectedProvinceLabel(value.province);

              // Find city ID if province found
              if (value.city && provinceId) {
                const cityId = await findCityIdByName(value.city, provinceId);
                if (cityId) {
                  setSelectedCityId(cityId);
                  setSelectedCityLabel(value.city);
                } else {
                  setSelectedCityId('');
                  setSelectedCityLabel('');
                }
              } else {
                setSelectedCityId('');
                setSelectedCityLabel('');
              }
            } else {
              setSelectedProvinceId('');
              setSelectedProvinceLabel('');
              setSelectedCityId('');
              setSelectedCityLabel('');
            }
          } else {
            setSelectedProvinceId('');
            setSelectedProvinceLabel('');
            setSelectedCityId('');
            setSelectedCityLabel('');
          }
        } else {
          setSelectedRegionId('');
          setSelectedRegionLabel('');
          setSelectedProvinceId('');
          setSelectedProvinceLabel('');
          setSelectedCityId('');
          setSelectedCityLabel('');
        }
      } else {
        setSelectedRegionId('');
        setSelectedRegionLabel('');
        setSelectedProvinceId('');
        setSelectedProvinceLabel('');
        setSelectedCityId('');
        setSelectedCityLabel('');
      }
    };

    initializeLocationIds();
  }, [value.region, value.province, value.city]);

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
    // Phone validation using formsFormatter (editable field)
    const phoneValidation = getPhoneValidationMessage(form.phone);
    if (phoneValidation) next.phone = phoneValidation;
    // Street validation (editable field)
    const streetValidation = getStreetValidationMessage(form.address || '');
    if (streetValidation) next.address = streetValidation;
    // Barangay validation (editable field)
    const barangayValidation = getBarangayValidationMessage(
      form.barangay || ''
    );
    if (barangayValidation) next.barangay = barangayValidation;
    // Building validation (optional, editable field)
    if (form.building) {
      const buildingValidation = getBuildingNumberValidationMessage(
        form.building
      );
      if (buildingValidation) next.building = buildingValidation;
    }
    // ZIP code validation (editable field)
    // Format to 4 digits first, then validate
    const formattedZip = formatZipCodeInput(form.zipCode);
    const zipValidation = getZipValidationMessage(formattedZip);
    if (zipValidation) next.zipCode = zipValidation;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    // Normalize phone number before saving (remove space, ensure +639XXXXXXXXX format)
    const normalizedPhone = normalizePhone(form.phone);
    const formToSave = { ...form, phone: normalizedPhone };
    setConfirmOpen(false);
    onSave(formToSave);
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

  const formatPHMobile = (localDigits: string) => `+63${localDigits}`;

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Text variant="span" className="device-text-body" weight="medium">
              Gender
            </Text>
            <Text
              variant="p"
              className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
            >
              {value.gender
                ? value.gender.charAt(0).toUpperCase() + value.gender.slice(1)
                : 'Not specified'}
            </Text>
          </div>
          <div>
            <Text variant="span" className="device-text-body" weight="medium">
              Birthday
            </Text>
            <Text
              variant="p"
              className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
            >
              {value.birthday
                ? new Date(value.birthday).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Not specified'}
            </Text>
          </div>
        </div>

        <div>
          <Text variant="span" className="device-text-body" weight="medium">
            Email Address
          </Text>
          <Text
            variant="p"
            className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
          >
            {value.email}
          </Text>
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
                // Format as +63XXXXXXXXX (no space) to match Step2Personal
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
              <>
                <Input
                  type="text"
                  value={form.address || ''}
                  onChange={e =>
                    setForm(p => ({ ...p, address: e.target.value }))
                  }
                  onBlur={e => {
                    setForm(prev => ({
                      ...prev,
                      address: formatToProperNoun(e.target.value),
                    }));
                  }}
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={
                    errors.address ? 'address-error' : undefined
                  }
                  placeholder="Enter street address"
                />
                {errors.address && (
                  <Text
                    id="address-error"
                    variant="p"
                    className="text-error mt-1 device-text-caption"
                  >
                    {errors.address}
                  </Text>
                )}
              </>
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
              <>
                <Input
                  value={form.building}
                  onChange={e =>
                    setForm(p => ({ ...p, building: e.target.value }))
                  }
                  onBlur={e => {
                    setForm(prev => ({
                      ...prev,
                      building: formatToProperNoun(e.target.value),
                    }));
                  }}
                  aria-invalid={Boolean(errors.building)}
                  aria-describedby={
                    errors.building ? 'building-error' : undefined
                  }
                />
                {errors.building && (
                  <Text
                    id="building-error"
                    variant="p"
                    className="text-error mt-1 device-text-caption"
                  >
                    {errors.building}
                  </Text>
                )}
              </>
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
              <>
                <Input
                  value={form.barangay}
                  onChange={e =>
                    setForm(p => ({ ...p, barangay: e.target.value }))
                  }
                  onBlur={e => {
                    setForm(prev => ({
                      ...prev,
                      barangay: formatToProperNoun(e.target.value),
                    }));
                  }}
                  aria-invalid={Boolean(errors.barangay)}
                  aria-describedby={
                    errors.barangay ? 'barangay-error' : undefined
                  }
                />
                {errors.barangay && (
                  <Text
                    id="barangay-error"
                    variant="p"
                    className="text-error mt-1 device-text-caption"
                  >
                    {errors.barangay}
                  </Text>
                )}
              </>
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
              Region
            </Text>
            {isEditing ? (
              <SearchableSelect
                label=""
                required
                value={selectedRegionId}
                onChange={(_value, option) => {
                  setSelectedRegionId(_value);
                  setSelectedProvinceId('');
                  setSelectedProvinceLabel('');
                  setForm(p => ({ ...p, region: option?.label || '' }));
                  setForm(p => ({ ...p, province: '' }));
                  setForm(p => ({ ...p, city: '' }));
                  setSelectedCityId('');
                  setSelectedCityLabel('');
                }}
                fetchOptions={fetchRegions}
                placeholder="Select region"
                initialLabel={selectedRegionLabel || value.region}
              />
            ) : (
              <Text
                variant="p"
                className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
              >
                {value.region || 'Not specified'}
              </Text>
            )}
          </div>
          <div>
            <Text variant="span" className="device-text-body" weight="medium">
              Province
            </Text>
            {isEditing ? (
              <SearchableSelect
                label=""
                required
                value={selectedProvinceId}
                onChange={(_value, option) => {
                  setSelectedProvinceId(_value);
                  setSelectedProvinceLabel(option?.label || '');
                  setForm(p => ({ ...p, province: option?.label || '' }));
                  setForm(p => ({ ...p, city: '' }));
                  setSelectedCityId('');
                  setSelectedCityLabel('');
                }}
                fetchOptions={fetchProvinces}
                placeholder={
                  provinceDisabled ? 'Select region first' : 'Select province'
                }
                disabled={provinceDisabled}
                initialLabel={selectedProvinceLabel || value.province}
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
              City
            </Text>
            {isEditing ? (
              <SearchableSelect
                label=""
                required
                value={selectedCityId}
                onChange={(_value, option) => {
                  setSelectedCityId(_value);
                  setSelectedCityLabel(option?.label || '');
                  setForm(p => ({ ...p, city: option?.label || '' }));
                }}
                fetchOptions={fetchCities}
                placeholder={
                  cityDisabled
                    ? 'Select province first'
                    : 'Select city/municipality'
                }
                disabled={cityDisabled}
                initialLabel={selectedCityLabel || value.city}
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
              ZIP Code
            </Text>
            {isEditing ? (
              <>
                <Input
                  type="text"
                  value={formatZipCodeInput(form.zipCode)}
                  onChange={e => {
                    const formatted = formatZipCodeInput(e.target.value);
                    setForm(p => ({ ...p, zipCode: formatted }));
                  }}
                  aria-invalid={Boolean(errors.zipCode)}
                  aria-describedby={
                    errors.zipCode ? 'zipCode-error' : undefined
                  }
                  maxLength={4}
                />
                {errors.zipCode && (
                  <Text
                    id="zipCode-error"
                    variant="p"
                    className="text-error mt-1 device-text-caption"
                  >
                    {errors.zipCode}
                  </Text>
                )}
              </>
            ) : (
              <Text
                variant="p"
                className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
              >
                {formatZipCodeInput(value.zipCode)}
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
            <Button threeD onClick={handleConfirmSave}>
              Confirm
            </Button>
          </div>
        </Card>
      </Modal>
    </Card>
  );
};

export default PersonalInfoForm;
