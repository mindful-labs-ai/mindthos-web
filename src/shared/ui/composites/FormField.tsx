import React from 'react';

import { cn } from '@/lib/cn';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * FormField - 폼 입력 래퍼
 * 라벨, 에러, 도움말 텍스트 표시
 *
 * @example
 * <FormField label="Email" required error="Invalid"><Input /></FormField>
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
