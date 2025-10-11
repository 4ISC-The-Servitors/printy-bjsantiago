import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Text } from '../../shared';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

/**
 * Empty state for chat when no messages are present
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No messages yet',
  description = 'Start a conversation to see messages here',
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-brand-primary-50 flex items-center justify-center mb-4">
        {icon || <MessageSquare className="w-8 h-8 text-brand-primary" />}
      </div>
      <Text
        variant="h3"
        size="lg"
        weight="semibold"
        className="text-center mb-2"
      >
        {title}
      </Text>
      <Text
        variant="p"
        size="sm"
        color="muted"
        className="text-center max-w-sm"
      >
        {description}
      </Text>
    </div>
  );
};

export default EmptyState;
