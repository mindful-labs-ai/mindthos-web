import React from 'react';

import { cn } from '@/lib/cn';

export interface FormFieldProps {
  /**
   * Label text
   */
  label?: string;
  /**
   * Required indicator
   */
  required?: boolean;
  /**
   * Error message
   */
  error?: string;
  /**
   * Helper text
   */
  helperText?: string;
  /**
   * Form field content (Input, TextArea, etc.)
   */
  children: React.ReactNode;
  /**
   * Additional className for wrapper
   */
  className?: string;
}

/**
 * FormField component
 *
 * Wrapper for form inputs with label, error, and helper text.
 *
 * **A11y**: htmlFor linking label to input, aria-describedby for errors/helper text.
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   required
 *   error="Invalid email format"
 *   helperText="We'll never share your email"
 * >
 *   <Input type="email" />
 * </FormField>
 * ```
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  children,
  className,
}) => {
  const fieldId = React.useId();
  const errorId = error ? `${fieldId}-error` : undefined;
  const helperId = helperText ? `${fieldId}-helper` : undefined;

  // Clone child element to add IDs for a11y
  const childElement = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement, {
        id: fieldId,
        'aria-describedby': cn(errorId, helperId).trim() || undefined,
        'aria-invalid': error ? true : undefined,
      })
    : children;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-fg">
          {label}
          {required && (
            <span className="ml-1 text-danger" aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      {childElement}
      {error && (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-sm text-fg-muted">
          {helperText}
        </p>
      )}
    </div>
  );
};

FormField.displayName = 'FormField';
