import React from 'react';
import { Card, Text } from '../../shared';

const EmptyState: React.FC = () => {
  return (
    <Card className="p-8 text-center">
      <Text variant="h3" size="lg" weight="semibold" className="mb-2">
        No conversations yet
      </Text>
      <Text variant="p" size="sm" color="muted">
        Start a chat from the dashboard to see it here.
      </Text>
    </Card>
  );
};

export default EmptyState;


