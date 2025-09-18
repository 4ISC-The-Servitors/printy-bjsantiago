import React from 'react';
import { cn } from '../../lib/utils';

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  value?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked,
      onCheckedChange,
      disabled,
      className,
      id,
      name,
      value,
      ...props
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={e => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
        className={cn(
          'w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
