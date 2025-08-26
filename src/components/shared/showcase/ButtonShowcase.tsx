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

      <Text variant="h3" size="xl" weight="semibold">
        3D Buttons
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button variant="primary" threeD>Primary 3D</Button>
        <Button variant="secondary" threeD>Secondary 3D</Button>
        <Button variant="accent" threeD>Accent 3D</Button>
        <Button variant="ghost" threeD className="active:scale-98">Ghost 3D</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button size="sm" threeD>Small 3D</Button>
        <Button size="md" threeD>Medium 3D</Button>
        <Button size="lg" threeD>Large 3D</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button loading threeD>Loading 3D</Button>
        <Button disabled threeD>Disabled 3D</Button>
      </div>
    </section>
  );
};

export default ButtonShowcase;
