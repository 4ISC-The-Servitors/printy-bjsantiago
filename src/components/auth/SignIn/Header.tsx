import React from 'react';
import { Text } from '../../shared';

interface Props {
  onNavigateSignUp: () => void;
}

const Header: React.FC<Props> = ({ onNavigateSignUp }) => {
  return (
    <div className="text-center mb-8">
      <Text
        variant="h1"
        size="4xl"
        weight="bold"
        className="text-neutral-900 mb-2"
      >
        Sign in to your account
      </Text>
      <Text variant="p" size="base" color="muted">
        Don't have an account?{' '}
        <button
          className="text-brand-accent hover:text-brand-accent-700 font-medium transition-colors"
          onClick={onNavigateSignUp}
        >
          Sign up
        </button>
      </Text>
    </div>
  );
};

export default Header;
