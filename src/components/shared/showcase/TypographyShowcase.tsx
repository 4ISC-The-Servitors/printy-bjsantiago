import React from 'react';
import { Text } from '../index';

const TypographyShowcase: React.FC = () => {
  return (
    <section className="space-y-6">
      <Text variant="h2" size="2xl" weight="semibold">
        Typography
      </Text>
      
      <div className="space-y-4">
        <Text variant="h1" size="5xl" weight="bold">Heading 1</Text>
        <Text variant="h2" size="4xl" weight="semibold">Heading 2</Text>
        <Text variant="h3" size="3xl" weight="medium">Heading 3</Text>
        <Text variant="p" size="lg">Large paragraph text</Text>
        <Text variant="p" size="base">Regular paragraph text</Text>
        <Text variant="p" size="sm" color="muted">Small muted text</Text>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Text variant="p" color="primary">Primary colored text</Text>
        <Text variant="p" color="accent">Accent colored text</Text>
        <Text variant="p" color="success">Success colored text</Text>
        <Text variant="p" color="error">Error colored text</Text>
      </div>
    </section>
  );
};

export default TypographyShowcase;
