import React from 'react';
import Button, { type ButtonProps } from './Button';
import { CheckCheck } from 'lucide-react';
import Tooltip from './Tooltip';

export interface MarkAllReadButtonProps extends Omit<ButtonProps, 'children'> {
  label?: string;
}

const MarkAllReadButton: React.FC<MarkAllReadButtonProps> = ({
  label = 'Mark all as Read',
  variant = 'ghost',
  size = 'sm',
  className,
  ...props
}) => {
  return (
    <Tooltip label={label} position="bottom">
      <Button
        aria-label={label}
        title={label}
        variant={variant}
        size={size}
        className={className}
        {...props}
      >
        <CheckCheck className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
      </Button>
    </Tooltip>
  );
};

export default MarkAllReadButton;


