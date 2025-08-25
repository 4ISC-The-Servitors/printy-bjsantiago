import React from 'react';
import { Badge } from '../index';
import { Text } from '../index';

const BadgeShowcase: React.FC = () => {
  return (
    <section className="space-y-6">
      <Text variant="h2" size="2xl" weight="semibold">
        Badges
      </Text>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="accent">Accent</Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
          <Badge size="lg">Large</Badge>
        </div>
      </div>
    </section>
  );
};

export default BadgeShowcase;
