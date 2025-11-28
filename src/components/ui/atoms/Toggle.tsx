import React from 'react';

import { cn } from '@/lib/cn';

export type ToggleSize = 'sm' | 'md' | 'lg' | 'free';

export interface ToggleProps
  extends Omit<
    React.ComponentPropsWithoutRef<'button'>,
    'size' | 'type' | 'onChange'
  > {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: ToggleSize;
  name?: string;
  value?: string;
}

const sizeStyles: Record<
  ToggleSize,
  { track: string; thumb: string; translate: string }
> = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translate: 'translate-x-4',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'h-7 w-14',
    thumb: 'h-6 w-6',
    translate: 'translate-x-7',
  },
  free: {
    track: '',
    thumb: '',
    translate: 'translate-x-full',
  },
};

/**
 * Toggle - 스위치 토글 컴포넌트
 * controlled/uncontrolled 모드 지원
 * role="switch"로 접근성 준수, Space/Enter 키 동작
 *
 * @example
 * <Toggle checked={enabled} onChange={setEnabled} />
 */
export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      className,
      checked: controlledChecked,
      defaultChecked = false,
      onChange,
      size = 'md',
      disabled,
      name,
      value,
      ...props
    },
    ref
  ) => {
    const [uncontrolledChecked, setUncontrolledChecked] =
      React.useState(defaultChecked);
    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked : uncontrolledChecked;

    const handleToggle = () => {
      const newChecked = !checked;
      if (!isControlled) {
        setUncontrolledChecked(newChecked);
      }
      onChange?.(newChecked);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle();
      }
    };

    return (
      <>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={cn(
            'relative inline-flex items-center rounded-full',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
            'disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-primary' : 'bg-border',
            sizeStyles[size].track,
            className
          )}
          {...props}
        >
          <span
            className={cn(
              'inline-block rounded-full bg-surface transition-transform duration-200',
              'shadow-sm',
              sizeStyles[size].thumb,
              checked ? sizeStyles[size].translate : 'translate-x-0.5'
            )}
          />
        </button>
        {name && (
          <input
            type="checkbox"
            name={name}
            value={value}
            checked={checked}
            onChange={() => {}}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        )}
      </>
    );
  }
);

Toggle.displayName = 'Toggle';
