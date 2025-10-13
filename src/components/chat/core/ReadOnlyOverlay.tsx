import React from 'react';
import { Text } from '../../shared';

interface ReadOnlyOverlayProps {
  className?: string;
}

/**
 * ReadOnlyOverlay - Displays when a conversation has ended
 * Should be contained within message groups to avoid overlapping with sidebars/navbars
 */
export const ReadOnlyOverlay: React.FC<ReadOnlyOverlayProps> = ({ 
  className = "" 
}) => {
  return (
    <div className={`bg-neutral-50 border-t border-neutral-200 p-3 text-center ${className}`}>
      <Text variant="p" size="sm" color="muted">
        This conversation has ended but you can view messages.
      </Text>
    </div>
  );
};

export default ReadOnlyOverlay;
