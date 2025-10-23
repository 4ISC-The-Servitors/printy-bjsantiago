import React from 'react';
import { Input, Text } from '@shared/components';
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
  // Password requirements validation
  const passwordRequirements = [
    {
      text: 'At least 8 characters',
      isValid: password.length >= 8,
    },
    {
      text: 'One lowercase letter',
      isValid: /(?=.*[a-z])/.test(password),
    },
    {
      text: 'One uppercase letter',
      isValid: /(?=.*[A-Z])/.test(password),
    },
    {
      text: 'One number',
      isValid: /(?=.*\d)/.test(password),
    },
    {
      text: 'One special character',
      isValid: /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password),
    },
  ];

  // Password confirmation validation
  const isPasswordMatch = password && confirmPassword && password === confirmPassword;
  const isPasswordMismatch = password && confirmPassword && password !== confirmPassword;
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
        
        {/* Password Requirements */}
        {password && (
          <div className="mt-2 space-y-1">
            <Text variant="span" className="text-sm text-neutral-600">
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

      <div className="space-y-2">
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={e => onChange('confirmPassword', e.target.value)}
          required
          className={`pr-24 ${
            isPasswordMatch
              ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
              : isPasswordMismatch
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : ''
          }`}
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
          
          {/* Password Match Indicator */}
          {confirmPassword && (
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
        </Input>
        
        {/* Password Match Status Text */}
        {confirmPassword && (
          <div className="mt-1">
            {isPasswordMatch ? (
              <Text variant="span" className="text-sm text-green-700 flex items-center gap-1">
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
              <Text variant="span" className="text-sm text-red-700 flex items-center gap-1">
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
    </div>
  );
};

export default Step1Account;
