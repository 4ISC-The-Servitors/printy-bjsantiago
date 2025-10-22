import React from 'react';

interface ReadOnlyOverlayProps {
  className?: string;
}

/**
 * ReadOnlyOverlay - Displays when a conversation has ended
 * Sticky positioning keeps it at the bottom of the chat container
 * while scrolling through messages, contained within chat boundaries
 */
export const ReadOnlyOverlay: React.FC<ReadOnlyOverlayProps> = ({
  className = ""
}) => {
  return (
    <div className={`sticky bottom-0 left-0 right-0 z-20 mt-4 ${className}`}>
      {/* Gradient fade above overlay - creates smooth transition from messages to overlay */}
      <div className="absolute bottom-full left-0 right-0 h-8 bg-gradient-to-t from-neutral-50 to-transparent pointer-events-none" />

      {/* Main overlay container with depth and shadow */}
      <div className="relative bg-neutral-50 p-3 text-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08),0_-2px_4px_-1px_rgba(0,0,0,0.04)]">
        {/* Subtle top highlight for depth (light from above principle) */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <span className="text-sm text-neutral-500 relative z-10">
          This conversation has ended but you can view messages.
        </span>
      </div>
    </div>
  );
};

export default ReadOnlyOverlay;
