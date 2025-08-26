import React from 'react';

interface TypingIndicatorProps {
  delay?: number;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ delay = 1500 }) => (
  <div 
    className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-brand-primary-50 text-neutral-700 text-sm align-middle"
    style={{ animationDelay: `${delay}ms` }}
  >
    <span className="relative inline-flex w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:-200ms]" />
    <span className="relative inline-flex w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:-100ms]" />
    <span className="relative inline-flex w-2 h-2 rounded-full bg-neutral-400 animate-bounce" />
  </div>
);

export default TypingIndicator;
