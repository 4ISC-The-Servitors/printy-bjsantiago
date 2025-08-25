import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
  required?: boolean;
  className?: string;
  wrapperClassName?: string;
  children?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      description,
      required = false,
      className,
      wrapperClassName,
      children,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const descriptionId = `${inputId}-description`;

    return (
      <div className={cn('space-y-2', wrapperClassName)}>
        {label && <InputLabel htmlFor={inputId} required={required}>{label}</InputLabel>}
        {description && <InputDescription id={descriptionId}>{description}</InputDescription>}
        <div className="relative">
          <InputField
            ref={ref}
            id={inputId}
            error={error}
            descriptionId={description ? descriptionId : undefined}
            errorId={error ? errorId : undefined}
            className={className}
            {...props}
          />
          {children}
        </div>
        {error && <InputError id={errorId}>{error}</InputError>}
      </div>
    );
  }
);

Input.displayName = 'Input';

const InputLabel: React.FC<{ htmlFor: string; required: boolean; children: React.ReactNode }> = ({ 
  htmlFor, 
  required, 
  children 
}) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-700">
    {children}
    {required && (
      <span className="ml-1 text-error" aria-label="required">*</span>
    )}
  </label>
);

const InputDescription: React.FC<{ id: string; children: React.ReactNode }> = ({ 
  id, 
  children 
}) => (
  <p id={id} className="text-sm text-neutral-500">{children}</p>
);

const InputField = React.forwardRef<HTMLInputElement, {
  error?: string;
  descriptionId?: string;
  errorId?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>>(({ 
  error, 
  descriptionId, 
  errorId, 
  className, 
  ...props 
}, ref) => (
  <input
    ref={ref}
    className={cn(
      'input',
      error && 'border-error focus:border-error focus:ring-error/50',
      className
    )}
    aria-invalid={!!error}
    aria-describedby={cn(descriptionId, error && errorId)}
    {...props}
  />
));

InputField.displayName = 'InputField';

const InputError: React.FC<{ id: string; children: React.ReactNode }> = ({ 
  id, 
  children 
}) => (
  <p id={id} className="text-sm text-error" role="alert">{children}</p>
);

export default Input;
