import React from 'react';

interface ReadOnlyOverlayProps {
  className?: string;
}

/**
 * ReadOnlyOverlay - Displays when a conversation has ended
 * Fixed at bottom of chat container to remain visible during scroll
 */
export const ReadOnlyOverlay: React.FC<ReadOnlyOverlayProps> = ({ 
  className = "" 
}) => {
  return (
    <div className={`absolute bottom-0 left-0 right-0 bg-neutral-50 border-t border-neutral-200 p-3 text-center z-10 ${className}`}>
      <span className="text-sm text-neutral-500">
        This conversation has ended but you can view messages.
      </span>
    </div>
  );
};

export default ReadOnlyOverlay;
