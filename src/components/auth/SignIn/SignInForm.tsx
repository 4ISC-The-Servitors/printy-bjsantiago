import React from 'react';
import { Input, Button, Text } from '../../shared';
import { Eye, EyeOff, Mail } from 'lucide-react';

interface Props {
  email: string;
  password: string;
  keepLoggedIn: boolean;
  loading: boolean;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  onChange: (
    field: 'email' | 'password' | 'keepLoggedIn',
    value: string | boolean
  ) => void;
  onForgotPassword: () => void;
}

const SignInForm: React.FC<Props> = ({
  email,
  password,
  keepLoggedIn,
  loading,
  showPassword,
  setShowPassword,
  onChange,
  onForgotPassword,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Input
          label="Email"
          type="email"
          placeholder="you@email.com"
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
          placeholder="Enter your password"
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

      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={keepLoggedIn}
            onChange={e => onChange('keepLoggedIn', e.target.checked)}
            className="w-4 h-4 text-brand-primary border-neutral-300 rounded focus:ring-brand-primary focus:ring-2"
          />
          <Text variant="span" size="sm" className="text-neutral-700">
            Keep me logged in
          </Text>
        </label>

        <button
          type="button"
          className="text-error hover:text-error-700 text-sm font-medium transition-colors"
          onClick={onForgotPassword}
        >
          Forgot your password?
        </button>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        threeD
        loading={loading}
        disabled={loading}
        className="w-full btn-responsive-primary"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
    </div>
  );
};

export default SignInForm;
