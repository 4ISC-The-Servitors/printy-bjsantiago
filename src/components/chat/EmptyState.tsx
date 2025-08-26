import React from 'react';
import { Bot } from 'lucide-react';
import { Text } from '../shared';

export const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-brand-primary-50 flex items-center justify-center mx-auto mb-4">
        <Bot className="w-8 h-8 text-brand-primary" />
      </div>
      <Text variant="h4" size="lg" weight="semibold" className="mb-2">
        Start a conversation
      </Text>
      <Text variant="p" color="muted" className="max-w-md mx-auto">
        Choose from the options above or ask a question to get started.
      </Text>
    </div>
  );
};

export default EmptyState;
