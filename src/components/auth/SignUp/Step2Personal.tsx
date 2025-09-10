import React from 'react';
import { Input } from '../../shared';
import { Phone, User } from 'lucide-react';

interface Props {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  birthday: string;
  onChange: (
    field: 'firstName' | 'lastName' | 'phone' | 'gender' | 'birthday',
    value: string
  ) => void;
}

const Step2Personal: React.FC<Props> = ({
  firstName,
  lastName,
  phone,
  gender,
  birthday,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Input
          label="First Name"
          type="text"
          placeholder="Enter your first name"
          value={firstName}
          onChange={e => onChange('firstName', e.target.value)}
          required
          className="pr-12"
          wrapperClassName="relative"
        >
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <User className="w-5 h-5" />
          </div>
        </Input>
      </div>

      <div className="space-y-2">
        <Input
          label="Last Name"
          type="text"
          placeholder="Enter your last name"
          value={lastName}
          onChange={e => onChange('lastName', e.target.value)}
          required
          className="pr-12"
          wrapperClassName="relative"
        >
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <User className="w-5 h-5" />
          </div>
        </Input>
      </div>

      <div className="space-y-2">
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+63 9XXXXXXXXX"
          value={
            phone.startsWith('+63')
              ? phone
              : phone
                ? `+63${phone.replace(/^0+/, '')}`
                : '+63'
          }
          onChange={e => {
            let value = e.target.value;
            if (!value.startsWith('+63'))
              value = '+63' + value.replace(/^0+/, '').replace(/^\+?63/, '');
            let digits = value.slice(3).replace(/\D/g, '');
            digits = digits.slice(0, 10);
            value = '+63' + digits;
            if (value.length < 3) value = '+63';
            onChange('phone', value);
          }}
          maxLength={13}
          required
          className="pr-12"
          wrapperClassName="relative"
        >
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <Phone className="w-5 h-5" />
          </div>
        </Input>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Gender <span className="text-error">*</span>
        </label>
        <div className="relative">
          <select
            value={gender}
            onChange={e => onChange('gender', e.target.value)}
            required
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors appearance-none bg-white"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
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
        <Input
          label="Birthday"
          type="date"
          placeholder="mm/dd/yyyy"
          value={birthday}
          onChange={e => onChange('birthday', e.target.value)}
          required
          className=""
          wrapperClassName=""
        />
      </div>
    </div>
  );
};

export default Step2Personal;
