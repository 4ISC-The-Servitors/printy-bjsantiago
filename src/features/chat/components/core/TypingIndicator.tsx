import React from 'react';

export interface TypingIndicatorProps {
  delay?: number;
}

/**
 * Animated typing indicator (three bouncing dots)
 * Used to show bot is "thinking"
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  delay = 0,
}) => (
  <div
    className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-brand-primary-50 text-neutral-700 text-sm"
    style={{ animationDelay: delay > 0 ? `${delay}ms` : undefined }}
  >
    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:-200ms]" />
    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:-100ms]" />
    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" />
  </div>
);

export default TypingIndicator;
