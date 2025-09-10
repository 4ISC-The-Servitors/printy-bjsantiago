import React from 'react';
import { Button, Input } from '../../shared';
import { MapPin } from 'lucide-react';

interface Props {
  buildingNumber: string;
  street: string;
  barangay: string;
  region: string;
  province: string;
  city: string;
  agreeToTerms: boolean;
  onChange: (
    field:
      | 'buildingNumber'
      | 'street'
      | 'barangay'
      | 'region'
      | 'province'
      | 'city',
    value: string
  ) => void;
  onToggleTerms: (checked: boolean) => void;
}

const Step3Address: React.FC<Props> = ({
  buildingNumber,
  street,
  barangay,
  region,
  province,
  city,
  agreeToTerms,
  onChange,
  onToggleTerms,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Input
          label="Building/House Number (optional)"
          type="text"
          placeholder="Enter building or house number"
          value={buildingNumber}
          onChange={e => onChange('buildingNumber', e.target.value)}
          className="pr-12"
          wrapperClassName="relative"
        >
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"></div>
        </Input>
      </div>

      <div className="space-y-2">
        <Input
          label="Street"
          type="text"
          placeholder="Enter street name"
          value={street}
          onChange={e => onChange('street', e.target.value)}
          required
          className="pr-12"
          wrapperClassName="relative"
        >
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <MapPin className="w-5 h-5" />
          </div>
        </Input>
      </div>

      <div className="space-y-2">
        <Input
          label="Barangay"
          type="text"
          placeholder="Enter barangay"
          value={barangay}
          onChange={e => onChange('barangay', e.target.value)}
          required
          className="pr-12"
          wrapperClassName="relative"
        >
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <MapPin className="w-5 h-5" />
          </div>
        </Input>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Region <span className="text-error">*</span>
        </label>
        <div className="relative">
          <select
            value={region}
            onChange={e => onChange('region', e.target.value)}
            required
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors appearance-none bg-white"
          >
            <option value="NCR">NCR</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Province <span className="text-error">*</span>
        </label>
        <div className="relative">
          <select
            value={province}
            onChange={e => onChange('province', e.target.value)}
            required
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors appearance-none bg-white"
          >
            <option value="">Select province</option>
            <option value="metro-manila">Metro Manila</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          City/Municipality <span className="text-error">*</span>
        </label>
        <div className="relative">
          <select
            value={city}
            onChange={e => onChange('city', e.target.value)}
            required
            disabled={!province}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors appearance-none bg-white disabled:bg-neutral-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {province ? 'Select city/municipality' : 'Select province first'}
            </option>
            {province === 'metro-manila' && (
              <option value="manila">Manila</option>
            )}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

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
            onClick={() => console.log('Show terms of service')}
          >
            Terms of Service
          </Button>{' '}
          and{' '}
          <Button
            variant="ghost"
            size="sm"
            className="text-brand-primary hover:text-brand-primary-700 underline p-0 h-auto"
            onClick={() => console.log('Show privacy policy')}
          >
            Privacy Policy
          </Button>
        </label>
      </div>
    </div>
  );
};

export default Step3Address;
