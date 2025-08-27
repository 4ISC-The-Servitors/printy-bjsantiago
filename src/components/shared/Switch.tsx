import React from 'react';
import { cn } from '../../lib/utils';

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
  disabled?: boolean;
  label?: string;
}

const sizes = {
  sm: { track: 'h-5 w-9', thumb: 'h-4 w-4', translate: 'translate-x-4' },
  md: { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: 'translate-x-5' },
  lg: { track: 'h-7 w-14', thumb: 'h-6 w-6', translate: 'translate-x-7' },
  responsive: {
    track: 'h-5 w-9 md:h-6 md:w-11 lg:h-7 lg:w-14',
    thumb: 'h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6',
    translate: 'translate-x-4 md:translate-x-5 lg:translate-x-7',
  },
} as const;

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    { checked, onCheckedChange, size = 'md', disabled = false, label, className, ...props },
    ref
  ) => {
    const s = sizes[size];
    const handleClick = () => {
      if (disabled) return;
      onCheckedChange?.(!checked);
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCheckedChange?.(!checked);
      }
      if (e.key === 'ArrowRight') {
        onCheckedChange?.(true);
      }
      if (e.key === 'ArrowLeft') {
        onCheckedChange?.(false);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/50',
          checked ? 'bg-brand-primary' : 'bg-neutral-200',
          disabled && 'opacity-50 cursor-not-allowed',
          s.track,
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none inline-block transform rounded-full bg-white shadow transition-transform',
            s.thumb,
            checked ? s.translate : 'translate-x-1'
          )}
        />
      </button>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;


