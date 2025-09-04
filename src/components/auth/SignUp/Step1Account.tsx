import React from 'react';
import { Input } from '../../shared';
import { Eye, EyeOff, Mail } from 'lucide-react';

interface Props {
  email: string;
  password: string;
  confirmPassword: string;
  onChange: (
    field: 'email' | 'password' | 'confirmPassword',
    value: string
  ) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
}

const Step1Account: React.FC<Props> = ({
  email,
  password,
  confirmPassword,
  onChange,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={e => onChange('email', e.target.value)}
          required
          className="pr-12"
          wrapperClassName="relative"
        >
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <Mail className="w-5 h-5" />
          </div>
        </Input>
      </div>

      <div className="space-y-2">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="At least 8 characters"
          value={password}
          onChange={e => onChange('password', e.target.value)}
          required
          className="pr-24"
          wrapperClassName="relative"
        >
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </Input>
      </div>

      <div className="space-y-2">
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={e => onChange('confirmPassword', e.target.value)}
          required
          className="pr-24"
          wrapperClassName="relative"
        >
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label={
                showConfirmPassword ? 'Hide password' : 'Show password'
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </Input>
      </div>
    </div>
  );
};

export default Step1Account;
