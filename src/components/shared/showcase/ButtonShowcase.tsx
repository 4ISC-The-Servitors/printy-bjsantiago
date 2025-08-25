import React from 'react';
import { Button } from '../index';
import { Text } from '../index';

const ButtonShowcase: React.FC = () => {
  return (
    <section className="space-y-6">
      <Text variant="h2" size="2xl" weight="semibold">
        Buttons
      </Text>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button variant="primary">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="accent">Accent Button</Button>
        <Button variant="ghost">Ghost Button</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button size="sm">Small Button</Button>
        <Button size="md">Medium Button</Button>
        <Button size="lg">Large Button</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button loading>Loading Button</Button>
        <Button disabled>Disabled Button</Button>
      </div>
    </section>
  );
};

export default ButtonShowcase;
