import React, { useCallback, useState } from 'react';
import { Button, Input } from '@shared/components';
import { MapPin } from 'lucide-react';
import SearchableSelect from '@shared/components/ui/SearchableSelect';
import {
  cityOptions,
  provinceOptions,
  regionOptions,
} from '@shared/services/locationService';

interface Props {
  buildingNumber: string;
  street: string;
  barangay: string;
  region: string;
  province: string;
  city: string;
  zipCode: string;
  agreeToTerms: boolean;
  errors: {
    buildingNumber?: string;
    street?: string;
    barangay?: string;
    zipCode?: string;
  };
  onChange: (
    field:
      | 'buildingNumber'
      | 'street'
      | 'barangay'
      | 'region'
      | 'province'
      | 'city'
      | 'zipCode',
    value: string
  ) => void;
  onToggleTerms: (checked: boolean) => void;
}

const Step3Address: React.FC<Props> = ({
  buildingNumber,
  street,
  barangay,
  zipCode,
  agreeToTerms,
  errors,
  onChange,
  onToggleTerms,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');

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

  return (
    <div className="space-y-6">
      <Input
        label="Building/House Number (optional)"
        type="text"
        placeholder="Enter building or house number"
        value={buildingNumber}
        onChange={e => onChange('buildingNumber', e.target.value)}
        maxLength={100}
        error={errors.buildingNumber}
        className="pr-12"
        wrapperClassName="relative"
      >
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"></div>
      </Input>

      <Input
        label="Street"
        type="text"
        placeholder="Enter street name"
        value={street}
        onChange={e => onChange('street', e.target.value)}
        maxLength={100}
        required
        error={errors.street}
        className="pr-12"
        wrapperClassName="relative"
      >
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
          <MapPin className="w-5 h-5" />
        </div>
      </Input>

      <Input
        label="Barangay"
        type="text"
        placeholder="Enter barangay"
        value={barangay}
        onChange={e => onChange('barangay', e.target.value)}
        maxLength={100}
        required
        error={errors.barangay}
        className="pr-12"
        wrapperClassName="relative"
      >
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
          <MapPin className="w-5 h-5" />
        </div>
      </Input>

      <SearchableSelect
        label="Region"
        required
        value={selectedRegionId}
        onChange={(_value, option) => {
          // set selected ids for cascading and propagate human-readable name
          setSelectedRegionId(_value);
          setSelectedProvinceId('');
          onChange('region', option?.label || '');
          onChange('province', '');
          onChange('city', '');
          setSelectedCityId('');
        }}
        fetchOptions={fetchRegions}
        placeholder="Select region"
      />

      <SearchableSelect
        label="Province"
        required
        value={selectedProvinceId}
        onChange={(_value, option) => {
          setSelectedProvinceId(_value);
          onChange('province', option?.label || '');
          onChange('city', '');
          setSelectedCityId('');
        }}
        fetchOptions={fetchProvinces}
        placeholder={
          provinceDisabled ? 'Select region first' : 'Select province'
        }
        disabled={provinceDisabled}
      />

      <SearchableSelect
        label="City/Municipality"
        required
        value={selectedCityId}
        onChange={(_value, option) => {
          setSelectedCityId(_value);
          onChange('city', option?.label || '');
        }}
        fetchOptions={fetchCities}
        placeholder={
          cityDisabled ? 'Select province first' : 'Select city/municipality'
        }
        disabled={cityDisabled}
      />

      <Input
        label="ZIP Code"
        type="text"
        placeholder="Enter ZIP code (4 digits)"
        value={zipCode}
        onChange={e => onChange('zipCode', e.target.value)}
        maxLength={4}
        required
        error={errors.zipCode}
        className="pr-12"
        wrapperClassName="relative"
      >
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
          <MapPin className="w-5 h-5" />
        </div>
      </Input>

      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="agreeToTerms"
          checked={agreeToTerms}
          onChange={e => onToggleTerms(e.target.checked)}
          className="w-4 h-4 text-brand-primary border-neutral-300 rounded focus:ring-brand-primary focus:ring-2 mt-1"
          required
        />
        <label htmlFor="agreeToTerms" className="text-sm text-neutral-700">
          I agree to the{' '}
          <Button
            variant="ghost"
            size="sm"
            className="text-brand-primary hover:text-brand-primary-700 underline p-0 h-auto"
          >
            Terms of Service
          </Button>{' '}
          and{' '}
          <Button
            variant="ghost"
            size="sm"
            className="text-brand-primary hover:text-brand-primary-700 underline p-0 h-auto"
          >
            Privacy Policy
          </Button>
        </label>
      </div>
    </div>
  );
};

export default Step3Address;
