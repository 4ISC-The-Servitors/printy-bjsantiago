import React from 'react';
import Button, { type ButtonProps } from './Button';
import { Trash2 } from 'lucide-react';
import Tooltip from './Tooltip';

export interface DeleteAllNotificationsButtonProps
  extends Omit<ButtonProps, 'children'> {
  label?: string;
}

const DeleteAllNotificationsButton: React.FC<
  DeleteAllNotificationsButtonProps
> = ({
  label = 'Delete All',
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
        <Trash2 className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
      </Button>
    </Tooltip>
  );
};

export default DeleteAllNotificationsButton;
