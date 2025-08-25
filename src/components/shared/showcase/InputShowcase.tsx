import React from 'react';
import { Input } from '../index';
import { Text } from '../index';

const InputShowcase: React.FC = () => {
  return (
    <section className="space-y-6">
      <Text variant="h2" size="2xl" weight="semibold">
        Inputs
      </Text>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Email Address"
          placeholder="Enter your email"
          type="email"
          required
          description="We'll never share your email with anyone else."
        />
        <Input
          label="Password"
          placeholder="Enter your password"
          type="password"
          required
          error="Password must be at least 8 characters long"
        />
      </div>
    </section>
  );
};

export default InputShowcase;
